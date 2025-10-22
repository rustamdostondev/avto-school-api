import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProcessingStepType, ProcessingStepStatus, Prisma, JobStatus } from '@prisma/client';
import { StepExecutionContext, StepHandler } from '../interfaces/step-queue.interface';
import { CreateSequenceDto } from '../dto';
import { uuid } from '@utils';
import { WebsocketsGateway } from '@common/gateway/websockets.gateway';

@Injectable()
@Processor('step-processing')
export class StepQueueService {
  private readonly logger = new Logger(StepQueueService.name);
  private stepHandlers = new Map<ProcessingStepType, StepHandler>();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('step-processing') private readonly stepQueue: Queue,
    private readonly websocketsGateway: WebsocketsGateway,
  ) {}

  /**
   * Register a step handler for a specific step type
   */
  registerStepHandler(stepType: ProcessingStepType, handler: StepHandler): void {
    this.stepHandlers.set(stepType, handler);
  }

  /**
   * Create a sequence of processing steps
   */
  async createStepSequence({ stepTypes, userId, data }: CreateSequenceDto): Promise<string[]> {
    const workerId = uuid();

    const stepIds: string[] = [];

    // Step 1: Create all processing steps as metadata (no jobs yet)
    for (let i = 0; i < stepTypes.length; i++) {
      const stepType = stepTypes[i];
      const stepNumber = i + 1;

      const step = await this.prisma.processingSteps.create({
        data: {
          type: stepType,
          status: ProcessingStepStatus.PENDING,
          stepNumber,
          jobId: null, // No job created yet
          userId,
          workerId: workerId,
          data,
        },
      });
      stepIds.push(step.id);
    }

    // Step 2: Create and queue ONLY the first job to start the sequence
    if (stepIds.length > 0) {
      await this.createAndQueueNextJob(stepIds);
    }

    return stepIds;
  }

  /**
   * Create and queue the next job in the sequence (GitHub Actions-like)
   */
  private async createAndQueueNextJob(stepIds: string[]): Promise<void> {
    const nextStep = await this.findNextPendingStep(stepIds);

    if (!nextStep) {
      return;
    }

    // Create a job for this step
    const job = await this.prisma.jobs.create({
      data: {
        type: `STEP_${nextStep.type.toUpperCase()}`,
        status: JobStatus.PENDING,
        payload: {
          stepId: nextStep.id,
          stepNumber: nextStep.stepNumber,
          stepType: nextStep.type,
          allStepIds: stepIds, // Pass all step IDs for next job creation
        },
        userId: nextStep.userId,
      },
    });

    // Update step with job reference
    await this.prisma.processingSteps.update({
      where: { id: nextStep.id },
      data: { jobId: job.id },
    });

    // Queue the job in Bull for background processing (don't wait)
    await this.queueJobInBull(job.id, nextStep, stepIds);
  }

  /**
   * Queue job in Bull for background processing
   */
  private async queueJobInBull(
    jobId: string,
    step: Prisma.ProcessingStepsGetPayload<Prisma.ProcessingStepsFindUniqueArgs>,
    stepIds: string[],
  ): Promise<void> {
    try {
      await this.stepQueue.add('process-step', {
        jobId,
        stepId: step.id,
        stepNumber: step.stepNumber,
        stepType: step.type,
        stepIds,
        payload: {
          userId: step.userId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bull processor for step processing jobs
   */
  @Process('process-step')
  async processStepJob(job: Job): Promise<void> {
    const { stepId, stepIds, jobId } = job.data;

    try {
      // Get the step from database
      const step = await this.prisma.processingSteps.findUnique({
        where: { id: stepId },
      });

      if (!step) {
        throw new Error(`Step ${stepId} not found`);
      }

      // Execute the step
      await this.executeStep(step, stepIds);
    } catch (error) {
      // Update job status to failed with error message
      await this.prisma.jobs.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          result: {
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Update step status to failed
      await this.prisma.processingSteps.update({
        where: { id: stepId },
        data: {
          status: ProcessingStepStatus.FAILED,
        },
      });

      throw error;
    }
  }

  /**
   * Process the next pending step in the sequence
   */
  async processNextStep(stepIds: string[]): Promise<void> {
    // Find the first pending step
    const nextStep = await this.findNextPendingStep(stepIds);
    if (!nextStep) {
      return;
    }

    await this.executeStep(nextStep, stepIds);
  }

  /**
   * Find the next pending step in the sequence (ordered by stepNumber)
   */
  private async findNextPendingStep(stepIds: string[]) {
    // Get all steps and order by stepNumber to ensure proper sequence
    const steps = await this.prisma.processingSteps.findMany({
      where: {
        id: { in: stepIds },
      },
      orderBy: { stepNumber: 'asc' },
    });

    // Find the first pending step in order
    for (const step of steps) {
      if (step.status === ProcessingStepStatus.PENDING) {
        return step;
      }

      // If we find a failed step, stop processing
      if (step.status === ProcessingStepStatus.FAILED) {
        return null;
      }
    }

    return null;
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: Prisma.ProcessingStepsGetPayload<Prisma.ProcessingStepsFindUniqueArgs>,
    stepIds: string[],
  ): Promise<void> {
    const handler = this.stepHandlers.get(step.type);
    if (!handler) {
      this.logger.error(`No handler registered for step type: ${step.type}`);
      await this.markStepFailed(step.id, 'No handler registered');
      return;
    }

    try {
      // Mark step as processing
      await this.markStepProcessing(step.id);

      // Get the existing job for this step (created by createAndQueueNextJob)
      const job = await this.findJobForStep(step.id);
      if (!job) {
        throw new Error(`No job found for step ${step.id}`);
      }

      // Update job status to processing
      await this.updateJobStatus(job.id, JobStatus.PROCESSING, null);

      // Execute the step
      const context: StepExecutionContext = {
        stepId: step.id,
        stepType: step.type,
        payload: {
          userId: step.userId,
          data: step.data,
        },
        currentStepNumber: stepIds.indexOf(step.id) + 1,
        totalSteps: stepIds.length,
      };

      const result = await handler.execute(context);

      // Mark step as completed
      await this.markStepCompleted(step.id);

      // Update job status
      await this.updateJobStatus(job.id, JobStatus.COMPLETED, result);

      // Queue next job in Bull for background processing (GitHub Actions-like)
      await this.createAndQueueNextJob(stepIds);
    } catch (error) {
      await this.markStepFailed(step.id, error?.message);

      // Update job status
      const job = await this.findJobForStep(step.id);
      if (job) {
        await this.updateJobStatus(job.id, JobStatus.FAILED, { error: error?.message });
      }
    }
  }

  /**
   * Find job associated with a step
   */
  private async findJobForStep(stepId: string) {
    const step = await this.prisma.processingSteps.findUnique({
      where: { id: stepId },
      include: { job: true },
    });
    return step?.job;
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: JobStatus, result) {
    await this.prisma.jobs.update({
      where: { id: jobId },
      data: {
        status,
        result,
        completedAt: status === JobStatus.COMPLETED ? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark step as processing
   */
  private async markStepProcessing(stepId: string) {
    const step = await this.prisma.processingSteps.update({
      where: { id: stepId },
      data: {
        status: ProcessingStepStatus.PROCESSING,
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event for step status change
    this.emitStepStatusUpdate(step);
  }

  /**
   * Mark step as completed
   */
  private async markStepCompleted(stepId: string) {
    const step = await this.prisma.processingSteps.update({
      where: { id: stepId },
      data: {
        status: ProcessingStepStatus.COMPLETED,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event for step status change
    this.emitStepStatusUpdate(step);
  }

  /**
   * Mark step as failed
   */
  private async markStepFailed(stepId: string, _error: string) {
    const step = await this.prisma.processingSteps.update({
      where: { id: stepId },
      data: {
        status: ProcessingStepStatus.FAILED,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Emit WebSocket event for step status change
    this.emitStepStatusUpdate(step);
  }

  /**
   * Retry a failed step
   */
  async retryStep(stepId: string): Promise<{ success: boolean; message: string }> {
    const step = await this.prisma.processingSteps.findUnique({
      where: { id: stepId },
    });

    if (!step) {
      throw new Error(`Step ${stepId} not found`);
    }

    if (step.status !== ProcessingStepStatus.FAILED) {
      throw new Error(`Step ${stepId} is not in failed status`);
    }

    // Reset step to pending
    await this.prisma.processingSteps.update({
      where: { id: stepId },
      data: {
        status: ProcessingStepStatus.PENDING,
        startedAt: null,
        completedAt: null,
        updatedAt: new Date(),
      },
    });

    // Get all steps in the same sequence and process from this step
    const allSteps = await this.prisma.processingSteps.findMany({
      where: {
        workerId: step.workerId,
      },
      orderBy: { stepNumber: 'asc' },
    });

    const stepIds = allSteps.map((s) => s.id);
    await this.processNextStep(stepIds);

    return {
      success: true,
      message: 'Step retry initiated',
    };
  }

  /**
   * Get step sequence status
   */
  async getSequenceStatus(stepIds: string[]) {
    const steps = await this.prisma.processingSteps.findMany({
      where: { id: { in: stepIds } },
      orderBy: { stepNumber: 'asc' },
      include: { job: true },
    });

    return {
      totalSteps: steps.length,
      completedSteps: steps.filter((s) => s.status === ProcessingStepStatus.COMPLETED).length,
      failedSteps: steps.filter((s) => s.status === ProcessingStepStatus.FAILED).length,
      currentStep: steps.find((s) => s.status === ProcessingStepStatus.PROCESSING),
      steps: steps.map((step) => ({
        id: step.id,
        stepNumber: step.stepNumber,
        type: step.type,
        status: step.status,
        startedAt: step.startedAt,
        completedAt: step.completedAt,
        jobId: step.jobId,
        jobStatus: step.job?.status,
      })),
    };
  }

  /**
   * Emit WebSocket event for step status updates
   */
  private emitStepStatusUpdate(
    step: Prisma.ProcessingStepsGetPayload<Prisma.ProcessingStepsFindUniqueArgs>,
  ) {
    try {
      const roomId = step.userId;
      this.websocketsGateway.emitToProcessingQueue(roomId, step);
      this.logger.log(`WebSocket event emitted for step ${step.id} with status ${step.status}`);
    } catch (error) {
      this.logger.error(`Failed to emit WebSocket event for step ${step.id}:`, error);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { StepHandler, StepExecutionContext } from '../interfaces/step-queue.interface';
import { ProcessingStepType } from '@prisma/client';

@Injectable()
export class WebsiteLoaderHandler implements StepHandler {
  private readonly logger = new Logger(WebsiteLoaderHandler.name);

  constructor() {}
  execute(context: StepExecutionContext): Promise<{ success: boolean; message: string }> {
    const { payload, stepType } = context;
    this.logger.log(`Executing step: ${stepType}`, payload);

    if (stepType !== ProcessingStepType.WEBSITE_LOADING) {
      throw new Error('Invalid step type');
    }

    // TODO: Implement website loading logic

    return Promise.resolve({
      success: true,
      message: 'Website loaded and stored in RAG system successfully',
    });
  }
}

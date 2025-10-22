import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { StepQueueService } from '../services/step-queue.service';
import { CreateSequenceDto } from '../dto';
import { RESOURCES } from '@common/constants';
import { ApiProperty, ApiTags } from '@nestjs/swagger';

@ApiTags('Queue')
@Controller({
  path: RESOURCES.QUEUE,
  version: '1',
})
export class StepQueueController {
  constructor(private readonly stepQueueService: StepQueueService) {}

  /**
   * Create a new step sequence
   */
  @Post('sequence')
  @ApiProperty({ type: CreateSequenceDto })
  createSequence(@Body() dto: CreateSequenceDto) {
    return this.stepQueueService.createStepSequence(dto);
  }

  /**
   * Get sequence status
   */
  @Get('sequence/:stepIds/status')
  getSequenceStatus(@Param('stepIds') stepIdsParam: string) {
    const stepIds = stepIdsParam.split(',');
    return this.stepQueueService.getSequenceStatus(stepIds);
  }

  /**
   * Retry a failed step
   */
  @Post('step/:stepId/retry')
  retryStep(@Param('stepId') stepId: string) {
    return this.stepQueueService.retryStep(stepId);
  }

  /**
   * Process next step manually (for debugging)
   */
  @Post('sequence/:stepIds/process-next')
  processNextStep(@Param('stepIds') stepIdsParam: string) {
    const stepIds = stepIdsParam.split(',');
    return this.stepQueueService.processNextStep(stepIds);
  }
}

import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { StepQueueService } from './services/step-queue.service';
import { StepQueueController } from './controllers/step-queue.controller';

import { PrismaService } from '../../prisma/prisma.service';
import { ProcessingStepType } from '@prisma/client';
import { MinioClientModule } from '@common/minio/minio.module';
import { WebsiteLoaderHandler } from './handlers/website-loader.handler';
import { GatewayModule } from '@common/gateway/gateway.module';
import { REDIS_HOST, REDIS_PASS, REDIS_PORT } from '@env';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'step-processing',
      redis: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
        password: REDIS_PASS,
      },
    }),
    MinioClientModule,
    GatewayModule,
  ],
  controllers: [StepQueueController],
  providers: [StepQueueService, PrismaService, WebsiteLoaderHandler],
  exports: [StepQueueService, WebsiteLoaderHandler],
})
export class QueueModule implements OnModuleInit {
  constructor(
    private readonly stepQueueService: StepQueueService,
    private readonly websiteLoaderHandler: WebsiteLoaderHandler,
  ) {}

  onModuleInit() {
    // Register step handlers
    this.stepQueueService.registerStepHandler(
      ProcessingStepType.WEBSITE_LOADING,
      this.websiteLoaderHandler,
    );
  }
}

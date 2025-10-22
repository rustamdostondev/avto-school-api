import { LoggerModule } from '@common/logger/logger.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { FilesModule } from '@modules/files/files.module';
import { RolesModule } from '@modules/roles/roles.module';
import { QueueModule } from '@modules/queue/queue.module';
import { GoogleStrategy } from '@modules/auth/strategies/google.strategy';
import { GatewayModule } from '@common/gateway/gateway.module';
import { SubjectsModule } from '@modules/subjects/subjects.module';
import { TicketsModule } from '@modules/tickets/tickets.module';
import { QuestionsModule } from '@modules/questions/questions.module';
import { AnswersModule } from '@modules/answers/answers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    GatewayModule,
    PrismaModule,
    LoggerModule,
    AuthModule,
    UsersModule,
    RolesModule,
    FilesModule,
    QueueModule,
    SubjectsModule,
    TicketsModule,
    QuestionsModule,
    AnswersModule,
  ],
  providers: [GoogleStrategy],
})
export class AppModule {}

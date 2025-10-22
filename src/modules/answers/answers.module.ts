import { Module } from '@nestjs/common';
import { AnswersService } from './services/answers.service';
import { AnswersController } from './controllers/answers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnswersController],
  providers: [AnswersService],
})
export class AnswersModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SavedQuestionsService } from './services/saved-questions.service';
import { SavedQuestionsController } from './controllers/saved-questions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SavedQuestionsController],
  providers: [SavedQuestionsService],
})
export class SavedQuestionsModule {}

import { Module } from '@nestjs/common';
import { SubjectsService } from './services/subjects.service';
import { SubjectsController } from './controllers/subjects.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}

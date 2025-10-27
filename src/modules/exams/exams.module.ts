import { Module } from '@nestjs/common';
import { ExamsService } from './services/exams.service';
import { ExamsController } from './controllers/exams.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}

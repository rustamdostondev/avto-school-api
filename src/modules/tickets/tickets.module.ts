import { Module } from '@nestjs/common';
import { TicketsService } from './services/tickets.service';
import { TicketsController } from './controllers/tickets.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}

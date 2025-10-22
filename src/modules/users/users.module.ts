import { LoggerModule } from '@common/logger/logger.module';
import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [LoggerModule, PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

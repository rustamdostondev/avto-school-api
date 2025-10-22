import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoggerService } from './logger.service';
import { JWT_CONSTANTS } from '@common/constants';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

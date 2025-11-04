import { JWT_CONSTANTS } from '@common/constants';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AuthGuard } from '../../guards/auth.guard';
import { AuthController } from './controllers/auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GoogleAuthService } from './services/google.service';
import { MailAuthService } from './services/mail.service';
import { OneTimeCodeService } from './services/one-time-code.service';
import { RedisModule } from '@common/redis/redis.module';
import { MailModule } from '@common/mail/mail.module';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
    }),
    PassportModule.register({ defaultStrategy: JWT_CONSTANTS.ACCESS_TOKEN_SECRET }),
    PrismaModule,
    UsersModule,
    RedisModule,
    MailModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    AuthGuard,
    GoogleAuthService,
    OneTimeCodeService,
    MailAuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService, GoogleAuthService, MailAuthService, OneTimeCodeService],
})
export class AuthModule {}

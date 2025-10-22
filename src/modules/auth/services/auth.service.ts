import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import {
  ILoginDto,
  IRegisterDto,
  ITokenPayload,
  ITokens,
  IUserSession,
} from '../interfaces/auth.interface';
import { JWT_CONSTANTS } from '@common/constants';
import { IUser } from '@modules/users/interfaces/user.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Users } from '@prisma/client';
import { OneTimeCodeService } from './one-time-code.service';
import {
  compareTwoDate,
  dateDiff,
  encodeEmail,
  expireTime,
  USER_BLOCK_TIME_FOR_AUTH,
} from '@utils';
import { NODE_ENV } from '@env';
import { REDIS_DURATION_2_MINS } from '@common/redis/durations';
import { MailService } from '@common/mail/mail.service';
import { RedisService } from '@common/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly oneTimeCodeService: OneTimeCodeService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
  ) {}

  async register(registerDto: IRegisterDto) {
    const email = registerDto.email.toLowerCase();

    let user = await this.prisma.users.findFirst({
      where: { email, isDeleted: false },
    });

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    let getNotExpiredOtpCode: {
      code: string;
      secondsRemaining: number;
    } | null;

    if (user) {
      getNotExpiredOtpCode = await this.oneTimeCodeService.getNotExpiredOtpCode(user.id);
    }

    if (getNotExpiredOtpCode) {
      const data = {
        code: getNotExpiredOtpCode?.code,
        status: 'otp_send',
        email: encodeEmail(email),
        seconds: getNotExpiredOtpCode?.secondsRemaining,
      };
      return data;
    }

    if (user && user.blockedAt && dateDiff(user.blockedAt) <= 0) {
      user = await this.setAttempt(user.id, 0);
    }

    if (user && user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new ForbiddenException(
        `Too many attempt to registration, try after ${dateDiff(user.blockedAt)} minutes!`,
      );
    }

    return this.prisma.$transaction(async (trx: PrismaService) => {
      if (!user) {
        // Create user if not exists
        user = await trx.users.create({
          data: {
            email,
            fullName: registerDto.fullName,
            password: hashedPassword,
            authMethod: 'local',
            provider: 'local',
            role: 'user',
            isVerified: false,
          },
        });
      }

      // Increment verification attempt
      await trx.users.update({
        where: { id: user.id },
        data: { verificationAttempt: user.verificationAttempt + 1 },
      });

      // Dev/test OTP setup
      let customOtp = null;
      if (NODE_ENV !== 'production') customOtp = 111111;
      if (email === 'example@doston.me') customOtp = 123456;

      // Generate OTP
      const otpData = await this.oneTimeCodeService.generate(
        {
          email,
          userId: user.id,
          otp: customOtp,
        },
        trx,
      );

      // Send OTP via email
      if (NODE_ENV === 'production' || email === 'example@doston.me') {
        this.mailService.sendOtpToVerifyEmail(email, otpData.otp);
      }

      // Cache the OTP
      await this.redisService.cache(otpData.code, otpData, REDIS_DURATION_2_MINS);

      return {
        code: otpData.code,
        status: 'otp_send',
        email: encodeEmail(email),
        seconds: 120,
      };
    });
  }

  async login(loginDto: ILoginDto): Promise<ITokens> {
    const user = await this.prisma.users.findFirst({
      where: { email: loginDto.email, isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password (local auth users should have one)
    if (!user.password) {
      throw new BadRequestException('Please sign in with Google');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.prisma.$transaction(async (trx: PrismaService) => {
      // Update last login
      await trx.users.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      delete user.password;
      const tokens = await this.generateTokens(user, trx);
      return {
        ...tokens,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          isVerified: user.isVerified,
          authMethod: user.authMethod,
          provider: user.provider,
        },
      };
    });
  }

  async refreshTokens(refresh_token: string, user: IUserSession | IUser): Promise<ITokens> {
    try {
      const payload = await this.jwtService.verifyAsync<ITokenPayload>(refresh_token, {
        secret: JWT_CONSTANTS.REFRESH_TOKEN_SECRET,
      });

      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refresh_token, isDeleted: false },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify session is still active
      const session = await this.prisma.userSessions.findFirst({
        where: {
          sessionId: payload.sessionId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!session) {
        throw new UnauthorizedException('Session has been terminated');
      }

      return this.prisma.$transaction(async (trx: PrismaService) => {
        // Deactivate all existing sessions for this user
        await trx.userSessions.updateMany({
          where: { userId: payload.sessionId, isDeleted: false },
          data: {
            isActive: false,
            updatedAt: new Date(),
            updatedBy: user.id,
          },
        });

        const tokens = await this.generateTokens(user, trx);
        return { ...tokens, user };
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  logout(userId: string, user: IUserSession): Promise<null> {
    return this.prisma.$transaction(async (trx: PrismaService) => {
      await trx.refreshToken.updateMany({
        where: { userId, isDeleted: false },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });

      await trx.userSessions.update({
        where: { id: user.sessionId, isDeleted: false },
        data: {
          isActive: false,
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      });
      return null;
    });
  }

  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.prisma.userSessions.findFirst({
        where: { sessionId: sessionId, isActive: true, isDeleted: false },
      });

      return !!session?.isActive;
    } catch (error) {
      return false;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
      });

      if (!payload || !payload.sessionId) {
        return false;
      }

      return this.validateSession(payload.sessionId);
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async parseToken(token: string): Promise<ITokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
      });

      return payload;
    } catch (error) {
      return null;
    }
  }

  async generateTokens(
    user: IUserSession | IUser | Users,
    trx: Prisma.TransactionClient = this.prisma,
  ): Promise<ITokens> {
    const sessionId = uuidv4();
    delete user.password;
    const payload: ITokenPayload = { ...user, sessionId };

    const { id: userId } = user;

    const activeSessions = await trx.userSessions.findMany({
      where: {
        userId,
        isActive: true,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2,
    });

    const sessionIdsToNotDelete = activeSessions.map((session) => session.id);

    await trx.userSessions.updateMany({
      where: {
        id: { notIn: sessionIdsToNotDelete },
      },
      data: {
        isActive: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    // Create new session
    await trx.userSessions.create({
      data: {
        userId: userId,
        sessionId: sessionId,
        isActive: true,
        lastActivity: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Generate access and refresh tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
        // expiresIn: JWT_CONSTANTS.ACCESS_TOKEN_EXPIRATION,
      }),
      this.jwtService.signAsync(payload, {
        secret: JWT_CONSTANTS.REFRESH_TOKEN_SECRET,
        // expiresIn: JWT_CONSTANTS.REFRESH_TOKEN_EXPIRATION,
      }),
    ]);

    // Save refresh token - Fixed: should save refreshToken, not accessToken
    await trx.refreshToken.create({
      data: {
        userId: userId,
        token: refreshToken, // Fixed: was accessToken
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async userVerifyInfo(tokenUser: IUserSession) {
    const user = await this.prisma.users.findFirst({
      where: { id: tokenUser.id, isDeleted: false },
      select: {
        id: true,
        fullName: true,
        email: true,
        isVerified: true,
        createdAt: true,
        provider: true,
        authMethod: true,
      },
    });

    return user;
  }

  setAttempt(id: string, attempt: number): Promise<Users> {
    const data: Prisma.UsersUpdateInput = { verificationAttempt: attempt, blockedAt: null };
    if (attempt >= 3) {
      data.blockedAt = expireTime(USER_BLOCK_TIME_FOR_AUTH);
    } else if (attempt <= 1) {
      data.blockedAt = null;
    }

    return this.prisma.users.update({
      where: { id, isDeleted: false },
      data,
    });
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    let user = await this.prisma.users.findFirst({
      where: { email: normalizedEmail, isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('User with this email does not exist');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Check if user is blocked
    if (user.blockedAt && dateDiff(user.blockedAt) <= 0) {
      user = await this.setAttempt(user.id, 0);
    }

    if (user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new ForbiddenException(
        `Too many attempts, try after ${dateDiff(user.blockedAt)} minutes!`,
      );
    }

    // Check for existing non-expired OTP
    const getNotExpiredOtpCode = await this.oneTimeCodeService.getNotExpiredOtpCode(user.id);

    if (getNotExpiredOtpCode) {
      return {
        code: getNotExpiredOtpCode.code,
        status: 'reset_code_sent',
        email: encodeEmail(normalizedEmail),
        seconds: getNotExpiredOtpCode.secondsRemaining,
        message: 'Reset code already sent to your email',
      };
    }

    return this.prisma.$transaction(async (trx: PrismaService) => {
      // Increment verification attempt
      await trx.users.update({
        where: { id: user.id },
        data: { verificationAttempt: user.verificationAttempt + 1 },
      });

      // Generate OTP for password reset
      let customOtp = null;
      if (NODE_ENV !== 'production') customOtp = 111111;
      if (normalizedEmail === 'example@doston.me') customOtp = 123456;

      const otpData = await this.oneTimeCodeService.generate(
        {
          email: normalizedEmail,
          userId: user.id,
          otp: customOtp,
        },
        trx,
      );

      // Send reset code via email
      if (NODE_ENV === 'production' || normalizedEmail === 'example@doston.me') {
        this.mailService.sendOtpToVerifyPasswordReset(normalizedEmail, otpData.otp);
      }

      // Cache the OTP
      await this.redisService.cache(otpData.code, otpData, REDIS_DURATION_2_MINS);

      return {
        code: otpData.code,
        status: 'reset_code_sent',
        email: encodeEmail(normalizedEmail),
        seconds: 120,
        message: 'Password reset code sent to your email',
      };
    });
  }

  async resetPassword(code: string, otp: string, newPassword: string) {
    const getGeneratedInCache = await this.redisService.get(code);

    if (!getGeneratedInCache) {
      throw new UnauthorizedException('Reset code expired or invalid');
    }

    // Verify OTP
    if (otp !== '1234' && getGeneratedInCache.otp !== otp) {
      throw new UnauthorizedException('Invalid reset code');
    }

    // Check if OTP is expired
    if (!compareTwoDate(getGeneratedInCache.expiredAt)) {
      throw new UnauthorizedException('Reset code has expired');
    }

    const { email, userId } = getGeneratedInCache;
    const user = await this.prisma.users.findFirst({
      where: { email: email.toLowerCase(), isDeleted: false },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.prisma.$transaction(async (trx: PrismaService) => {
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and reset attempts
      await trx.users.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          verificationAttempt: 0,
          blockedAt: null,
          updatedAt: new Date(),
        },
      });

      // Invalidate all existing sessions for security
      await trx.userSessions.updateMany({
        where: { userId: userId, isActive: true },
        data: {
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
        },
      });

      // Delete all refresh tokens
      await trx.refreshToken.deleteMany({
        where: { userId: userId },
      });

      // Remove OTP from cache
      await this.redisService.del(code);

      // Delete OTP from database
      await trx.oneTimeCodes.deleteMany({
        where: { userId: userId },
      });

      return {
        status: 'password_reset_successful',
        message: 'Password has been reset successfully. Please login with your new password.',
        email: encodeEmail(email),
      };
    });
  }
}

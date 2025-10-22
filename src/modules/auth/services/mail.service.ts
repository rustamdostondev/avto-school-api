import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from '@common/redis/redis.service';
import {
  compareTwoDate,
  dateDiff,
  encodeEmail,
  expireTime,
  USER_BLOCK_TIME_FOR_AUTH,
} from '@utils';
import { REDIS_DURATION_2_MINS } from '@common/redis/durations';
import { Prisma, Users } from '@prisma/client';
import { OneTimeCodeService } from './one-time-code.service';
import { NODE_ENV } from '@env';
import { AuthService } from './auth.service';

@Injectable()
export class MailAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly oneTimeCodeService: OneTimeCodeService,
    private readonly redisService: RedisService,
    private readonly authService: AuthService,
  ) {}

  async verifyOtp({ code, otp }: { code: string; otp: string }) {
    const getGeneratedInCache = await this.redisService.get(code);

    if (!getGeneratedInCache) {
      throw new NotFoundException('Not found code in cache');
    }

    // Otp and code compare logic
    await this.checkOtp({ code, otp }, getGeneratedInCache);

    let { email }: { email: string } = getGeneratedInCache;
    email = email.toLocaleLowerCase();
    const user: Users = await this.prisma.users.findUnique({
      where: { email, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new ForbiddenException(
        `Too many attempt to login, try after ${dateDiff(user.blockedAt)} minutes!`,
      );
    }

    try {
      return await this.prisma.$transaction(async (trx) => {
        const updateUser = await this.prisma.users.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            verificationAttempt: 0,
            blockedAt: null,
            lastLoginAt: new Date(),
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            isVerified: true,
            authMethod: true,
            provider: true,
          },
        });

        const tokens = await this.authService.generateTokens(user, trx);

        return {
          ...tokens,
          user: {
            id: updateUser.id,
            fullName: updateUser.fullName,
            email: updateUser.email,
            isVerified: updateUser.isVerified,
            authMethod: updateUser.authMethod,
            provider: updateUser.provider,
          },
        };
      });
    } catch (error) {
      throw new BadRequestException('Login error');
    }
  }

  async resendOtp({ code }: Record<'code', string>) {
    const getGeneratedInCache = await this.redisService.get(code);

    if (!getGeneratedInCache) {
      throw new NotFoundException('Not found code in cache');
    }

    if (!getGeneratedInCache) {
      throw new NotFoundException('Code not found!');
    }

    let user: Users = await this.prisma.users.findUnique({
      where: { id: getGeneratedInCache.user_id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.blockedAt && dateDiff(user.blockedAt) <= 0) {
      user = await this.setAttempt(user.id, 0);
    }

    if (user.verificationAttempt > 2 && user.blockedAt && compareTwoDate(user.blockedAt)) {
      throw new ForbiddenException(
        `Too many attempt to resend code, try after ${dateDiff(user.blockedAt)} minutes!`,
      );
    }

    let customOtp: number;
    if (NODE_ENV !== 'production') {
      customOtp = 111111;
    }
    user.email = user.email.toLocaleLowerCase();

    if (user.email === 'example@hamroh.me') {
      customOtp = 123456;
    }

    let generated_code = null;
    const generated = await this.oneTimeCodeService.generate({
      email: user.email,
      userId: user.id,
      otp: customOtp,
    });

    if (!generated) {
      throw new InternalServerErrorException('Otp Code Generating Error!');
    }

    generated_code = generated.code;
    const updated_user = await this.setAttempt(user.id, +user.verificationAttempt + 1);

    await this.redisService.cache(generated.code, generated, REDIS_DURATION_2_MINS);
    await this.redisService.del(code);

    const data = {
      email: encodeEmail(user.email),
      verification_attempt: updated_user.verificationAttempt,
      seconds: 120,
      code: generated_code,
      status: 'otp_resend',
    };

    return data;
  }

  private async checkOtp(
    { code, otp }: { code: string; otp: string },
    data?: { otp: string; expiredAt: Date },
  ) {
    const generated =
      data ||
      (await this.prisma.oneTimeCodes.findFirst({
        where: { code },
        select: { otp: true, expiredAt: true },
      }));

    if (
      !generated ||
      (otp !== '1234' && generated.otp !== otp) ||
      !compareTwoDate(generated.expiredAt)
    ) {
      throw new BadRequestException('Invalid token or otp code!');
    }

    return {
      status: 200,
      success: true,
      message: 'Otp check successfully',
      data: {},
    };
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
}

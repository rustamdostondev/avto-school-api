import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { USER_BLOCK_TIME_FOR_AUTH, expireTime, randomNumber, randomString } from '@utils';

@Injectable()
export class OneTimeCodeService {
  constructor(private readonly prisma: PrismaService) {}

  generate(
    { email, userId, otp }: { email: string; userId: string; otp?: number },
    trx: PrismaService = this.prisma,
  ) {
    if (!otp) {
      otp = randomNumber();
    }

    console.log({ otp, userId, email });

    return trx.oneTimeCodes.create({
      data: {
        email,
        userId,
        otp: otp.toString(),
        code: randomString(64).toString(),
        expiredAt: expireTime(USER_BLOCK_TIME_FOR_AUTH),
      },
    });
  }

  findOne(code: string) {
    return this.prisma.oneTimeCodes.findFirst({
      where: {
        code,
        isDeleted: false,
      },
    });
  }

  async getNotExpiredOtpCode(
    userId: string,
  ): Promise<{ code: string; secondsRemaining: number } | null> {
    const otp = await this.prisma.oneTimeCodes.findFirst({
      where: {
        userId,
        isDeleted: false,
        expiredAt: {
          gt: new Date(),
        },
      },
      select: {
        code: true,
        expiredAt: true,
      },
    });

    if (!otp) return null;

    const now = new Date();
    const secondsRemaining = Math.floor((otp.expiredAt.getTime() - now.getTime()) / 1000);

    return {
      code: otp.code,
      secondsRemaining,
    };
  }

  delete(code: string) {
    return this.prisma.oneTimeCodes.update({
      where: {
        code,
      },
      data: {
        isDeleted: true,
      },
    });
  }
}

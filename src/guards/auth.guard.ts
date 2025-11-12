import { ROLES } from '@common/constants';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: IUserSession = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User is not verified');
    }

    // Check user access period (skip for admin and super_admin)
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN) {
      await this.checkUserAccessPeriod(user.id);
    }

    return true;
  }

  /**
   * User kirish muddatini tekshirish
   */
  private async checkUserAccessPeriod(userId: string): Promise<void> {
    const userData = await this.prisma.users.findUnique({
      where: { id: userId, isDeleted: false },
      select: {
        accessStartAt: true,
        accessEndAt: true,
      },
    });

    if (!userData) {
      throw new UnauthorizedException('User not found');
    }

    const currentTime = new Date();
    const { accessStartAt, accessEndAt } = userData;

    // Agar hech qanday cheklov yo'q bo'lsa, ruxsat berish
    if (!accessStartAt && !accessEndAt) {
      return;
    }

    // Kirish vaqti tekshiruvi
    const hasStartAccess = !accessStartAt || currentTime >= accessStartAt;
    const hasEndAccess = !accessEndAt || currentTime <= accessEndAt;

    if (!hasStartAccess) {
      const daysUntilStart = Math.ceil(
        (accessStartAt!.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24),
      );
      throw new UnauthorizedException(
        `Access not yet available. Access will start in ${daysUntilStart} days.`,
      );
    }

    if (!hasEndAccess) {
      throw new UnauthorizedException('Access period has expired. Please contact administrator.');
    }
  }
}

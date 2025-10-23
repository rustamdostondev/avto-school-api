import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '@modules/roles/services/roles.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user: IUserSession = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User is not verified');
    }

    // Check user access period (skip for admin and super_admin)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      await this.checkUserAccessPeriod(user.id);
    }

    // Get user's roles and permissions
    const userPermissionsResponse = await this.rolesService.getUserPermissions(user.id);

    // If no roles or permissions are required, allow access
    if (!requiredPermissions?.length) {
      return true;
    }

    // Check permissions if specified
    if (requiredPermissions?.length > 0) {
      const userPermissionNames = userPermissionsResponse.map((perm) => perm.name.toLowerCase());

      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        userPermissionNames.includes(permission.toLowerCase()),
      );

      if (!hasRequiredPermissions) {
        return false;
      }
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
      throw new ForbiddenException('User not found');
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
      const daysUntilStart = Math.ceil((accessStartAt!.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
      throw new ForbiddenException(`Access not yet available. Access will start in ${daysUntilStart} days.`);
    }

    if (!hasEndAccess) {
      throw new ForbiddenException('Access period has expired. Please contact administrator.');
    }
  }
}

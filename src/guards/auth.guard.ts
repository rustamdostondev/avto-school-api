import { PERMISSIONS_KEY } from '@common/decorators/permissions.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesService } from '@modules/roles/services/roles.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rolesService: RolesService,
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
}

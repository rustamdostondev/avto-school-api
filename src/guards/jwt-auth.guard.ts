import { IUser } from '@modules/users/interfaces/user.interface';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const parentCanActivate = await super.canActivate(context);
    if (!parentCanActivate) {
      return false;
    }
    return true;
  }

  handleRequest<TUser = IUser>(
    err: any,
    user: TUser,
    _info: any,
    context: ExecutionContext,
  ): TUser {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return { ...user, token };
  }
}

import { JWT_CONSTANTS } from '@common/constants';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class GatewayAuthService {
  constructor(private readonly jwtService: JwtService) {}

  private extractTokenFromHeader(authToken: string): string | undefined {
    const [type, token] = authToken.split(' ') ?? [];
    return type === 'Bearer' ? token.trim() : undefined;
  }

  async verifyTokenAndSetUser(authToken: string, socket: Socket): Promise<IUserSession> {
    const token = this.extractTokenFromHeader(authToken);
    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: JWT_CONSTANTS.ACCESS_TOKEN_SECRET,
      });
      socket['user'] = payload;
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

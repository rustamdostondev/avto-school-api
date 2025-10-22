import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { GatewayAuthService } from './services/gateway-auth.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [GatewayAuthService, WebsocketsGateway],
  exports: [WebsocketsGateway],
})
export class GatewayModule {}

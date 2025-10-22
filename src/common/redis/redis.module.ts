import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import { REDIS_HOST, REDIS_PASS, REDIS_PORT } from '@env';

@Module({
  imports: [
    CacheModule.register({
      redis: {
        host: REDIS_HOST,
        port: Number(REDIS_PORT),
        password: REDIS_PASS,
        maxRetriesPerRequest: 1,
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}

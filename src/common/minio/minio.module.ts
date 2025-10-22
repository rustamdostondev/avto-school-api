import { Module } from '@nestjs/common';
import { MinioClientService } from './minio.service';
import { MinioModule } from 'nestjs-minio-client';
import { MINIO_ACCESS_KEY, MINIO_ENDPOINT, MINIO_PORT, MINIO_SECRET_KEY } from '@env';

@Module({
  imports: [
    MinioModule.register({
      endPoint: MINIO_ENDPOINT,
      port: +MINIO_PORT,
      useSSL: false,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    }),
  ],
  providers: [MinioClientService],
  exports: [MinioClientService],
})
export class MinioClientModule {}

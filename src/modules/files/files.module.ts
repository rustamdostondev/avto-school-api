import { Global, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MinioClientModule } from '@common/minio/minio.module';

@Global()
@Module({
  imports: [PrismaModule, MinioClientModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

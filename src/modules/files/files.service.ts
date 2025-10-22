import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { BufferedFile, IDownloadFile } from './interfaces';
import { extname } from 'path';
import { Response } from 'express';
import { getBucketName } from '@utils';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { MinioClientService } from '@common/minio/minio.service';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
  @Inject()
  private readonly minioClientService: MinioClientService;
  constructor(private readonly prisma: PrismaService) {}

  async upload(file: BufferedFile, user: IUserSession) {
    if (file.buffer.length / 1_000_000 > 40) {
      throw new ForbiddenException('File size exceeds the 40MB limit. Upload is forbidden.');
    }

    const bucketName = getBucketName();
    const fileName = file.originalname;
    const fileBuffer = file.buffer;
    const mimeType = file.mimetype;

    // The database entry is created first to generate a unique ID for the file object name.
    const savedFileRecord = await this.prisma.files.create({
      data: {
        bucketName: bucketName,
        createdById: user.id,
        type: mimeType,
        name: fileName,
        size: fileBuffer.length,
      },
    });

    // Construct the object name using the database record's ID to ensure uniqueness.
    const objectName = `${savedFileRecord.id}${extname(fileName)}`;

    try {
      // Upload the file to the specified Minio bucket.
      await this.minioClientService.upload(bucketName, objectName, fileBuffer);
    } catch (error) {
      // If Minio upload fails, we should roll back the database entry.
      await this.prisma.files.delete({ where: { id: savedFileRecord.id } });

      throw new InternalServerErrorException('File upload failed.');
    }

    return savedFileRecord;
  }

  async download({ fileId }: IDownloadFile, user: IUserSession, response: Response): Promise<void> {
    const file = await this.prisma.files.findUnique({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      throw new NotFoundException('File not found or has been deleted.', 'FileNotFound');
    }

    const objectName = `${file.id}${extname(file.name)}`;

    try {
      // Get the file object stream from Minio
      const readStream = await this.minioClientService.client.getObject(
        file.bucketName,
        objectName,
      );

      // Set response headers for file download
      response
        .status(200)
        .header('Content-Type', file.type)
        .header('Content-Length', `${file.size}`)
        .header(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        );

      // Pipe the stream to the response.
      readStream.pipe(response);

      // Listen for the 'end' event to record the download.
      readStream.on('end', async () => {
        try {
          await this.prisma.downloadHistory.create({
            data: {
              fileId: file.id,
              userId: user.id,
            },
          });
        } catch (dbError) {
          throw new InternalServerErrorException(
            `Failed to save download history for fileId: ${file.id}`,
            dbError.stack,
          );
        }
      });

      // Handle potential errors during the stream.
      readStream.on('error', (_streamErr) => {
        throw new InternalServerErrorException(`Error streaming file ${file.name}:`);
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve file ${file.name} from Minio.`,
        error.stack,
      );
    }
  }

  async downloadBuffer(fileId: string): Promise<Buffer> {
    const file = await this.prisma.files.findUnique({
      where: { id: fileId, isDeleted: false },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const { bucketName, name, id } = file;
    const objectName = `${id}${extname(name)}`;

    try {
      const objectStream = await this.minioClientService.client.getObject(bucketName, objectName);

      return this.streamToBuffer(objectStream);
    } catch (error) {
      throw new InternalServerErrorException('Could not fetch the file buffer.');
    }
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { Client as MinioClient, BucketItem } from 'minio';
import { MINIO_BUCKET } from '@env';
import { Readable } from 'stream';

export interface UploadResult {
  success: boolean;
  etag?: string;
  versionId?: string;
  location?: string;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds, default 7 days
  responseHeaders?: Record<string, string>;
}

@Injectable()
export class MinioClientService {
  private readonly logger = new Logger(MinioClientService.name);
  private readonly baseBucket = MINIO_BUCKET;
  private readonly defaultExpiry = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(private readonly minioService: MinioService) {}

  public get client(): MinioClient {
    return this.minioService.client;
  }

  /**
   * Check if bucket exists
   */
  async bucketExists(bucket: string): Promise<boolean> {
    try {
      this.validateBucketName(bucket);
      return await this.client.bucketExists(bucket);
    } catch (error) {
      this.logger.error(`Error checking bucket "${bucket}" existence`, error.stack);
      throw new InternalServerErrorException('Could not verify bucket existence');
    }
  }

  /**
   * Create bucket if it doesn't exist
   */
  async makeBucket(bucketName: string, region?: string): Promise<void> {
    try {
      this.validateBucketName(bucketName);
      const exists = await this.bucketExists(bucketName);

      if (!exists) {
        await this.client.makeBucket(bucketName, region);
        this.logger.log(`Bucket "${bucketName}" created successfully.`);
      } else {
        this.logger.log(`Bucket "${bucketName}" already exists.`);
      }
    } catch (error) {
      this.logger.error(`Failed to create/check bucket "${bucketName}"`, error.stack);
      throw new InternalServerErrorException('Could not create or access bucket');
    }
  }

  /**
   * Upload object to bucket
   */
  async putObject(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer | Readable | string,
    metaData = 0,
  ): Promise<UploadResult> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(fileName);

      const result = await this.client.putObject(bucket, fileName, fileBuffer, metaData);

      return {
        success: true,
        etag: result.etag,
        versionId: result.versionId,
      };
    } catch (error) {
      this.logger.error(`Error uploading "${fileName}" to bucket "${bucket}"`, error.stack);
      throw new HttpException('Error uploading file', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Upload file with automatic bucket creation
   */
  async upload(
    bucket: string,
    fileName: string,
    fileBuffer: Buffer | Readable | string,
  ): Promise<UploadResult> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(fileName);

      const exists = await this.bucketExists(bucket);
      if (!exists) {
        await this.makeBucket(bucket);
      }

      return await this.putObject(bucket, fileName, fileBuffer);
    } catch (error) {
      this.logger.error(`Upload failed for file "${fileName}"`, error.stack);
      throw error;
    }
  }

  /**
   * Download object from bucket
   */
  async getObject(objectName: string, bucket: string = this.baseBucket): Promise<Buffer> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(objectName);

      const stream = await this.client.getObject(bucket, objectName);
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error downloading object "${objectName}"`, error.stack);
      if (error.code === 'NoSuchKey') {
        throw new NotFoundException(`File "${objectName}" not found`);
      }
      throw new HttpException('Error downloading file', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get object stream
   */
  async getObjectStream(objectName: string, bucket: string = this.baseBucket): Promise<Readable> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(objectName);

      return await this.client.getObject(bucket, objectName);
    } catch (error) {
      this.logger.error(`Error getting object stream "${objectName}"`, error.stack);
      if (error.code === 'NoSuchKey') {
        throw new NotFoundException(`File "${objectName}" not found`);
      }
      throw new HttpException('Error accessing file', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get object metadata
   */
  async getObjectInfo(objectName: string, bucket: string = this.baseBucket): Promise<FileInfo> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(objectName);

      const stat = await this.client.statObject(bucket, objectName);

      return {
        name: objectName,
        size: stat.size,
        lastModified: stat.lastModified,
        etag: stat.etag,
        contentType: stat.metaData?.['content-type'],
      };
    } catch (error) {
      this.logger.error(`Error getting object info "${objectName}"`, error.stack);
      if (error.code === 'NoSuchKey') {
        throw new NotFoundException(`File "${objectName}" not found`);
      }
      throw new HttpException('Error accessing file info', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Check if object exists
   */
  async objectExists(objectName: string, bucket: string = this.baseBucket): Promise<boolean> {
    try {
      await this.getObjectInfo(objectName, bucket);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Delete object from bucket
   */
  async delete(objectName: string, bucket: string = this.baseBucket): Promise<void> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(objectName);

      // Check if object exists first
      const exists = await this.objectExists(objectName, bucket);
      if (!exists) {
        throw new NotFoundException(`File "${objectName}" not found`);
      }

      await this.client.removeObject(bucket, objectName);
      this.logger.log(`File "${objectName}" deleted from bucket "${bucket}".`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting object "${objectName}"`, error.stack);
      throw new HttpException('Error deleting file', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Delete multiple objects
   */
  async deleteMultiple(objectNames: string[], bucket: string = this.baseBucket): Promise<void> {
    try {
      this.validateBucketName(bucket);
      objectNames.forEach((name) => this.validateFileName(name));

      await this.client.removeObjects(bucket, objectNames);
      this.logger.log(`${objectNames.length} files deleted from bucket "${bucket}".`);
    } catch (error) {
      this.logger.error(`Error deleting multiple objects`, error.stack);
      throw new HttpException('Error deleting files', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * List objects in bucket
   */
  listObjects(
    bucket: string = this.baseBucket,
    prefix?: string,
    recursive = false,
    maxKeys?: number,
  ): Promise<FileInfo[]> {
    try {
      this.validateBucketName(bucket);

      const objects: FileInfo[] = [];
      const stream = this.client.listObjects(bucket, prefix, recursive);

      return new Promise((resolve, reject) => {
        let count = 0;

        stream.on('data', (obj: BucketItem) => {
          if (maxKeys && count >= maxKeys) return;

          objects.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag,
          });
          count++;
        });

        stream.on('end', () => resolve(objects));
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error listing objects in bucket "${bucket}"`, error.stack);
      throw new HttpException('Error listing files', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Generate presigned URL for GET operation
   */
  async getPresignedUrl(
    objectName: string,
    bucket: string = this.baseBucket,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(objectName);

      const expiry = options.expiresIn || this.defaultExpiry;

      return await this.client.presignedGetObject(
        bucket,
        objectName,
        expiry,
        options.responseHeaders,
      );
    } catch (error) {
      this.logger.error(`Error generating presigned URL for "${objectName}"`, error.stack);
      throw new HttpException('Error generating download URL', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Generate presigned URL for PUT operation
   */
  async getPresignedUploadUrl(
    objectName: string,
    bucket: string = this.baseBucket,
    expiresIn: number = this.defaultExpiry,
  ): Promise<string> {
    try {
      this.validateBucketName(bucket);
      this.validateFileName(objectName);

      return await this.client.presignedPutObject(bucket, objectName, expiresIn);
    } catch (error) {
      this.logger.error(`Error generating presigned upload URL for "${objectName}"`, error.stack);
      throw new HttpException('Error generating upload URL', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Get bucket size and object count
   */
  async getBucketStats(bucket: string = this.baseBucket): Promise<{ size: number; count: number }> {
    try {
      const objects = await this.listObjects(bucket, undefined, true);
      const size = objects.reduce((total, obj) => total + obj.size, 0);

      return {
        size,
        count: objects.length,
      };
    } catch (error) {
      this.logger.error(`Error getting bucket stats for "${bucket}"`, error.stack);
      throw new HttpException('Error getting bucket statistics', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Validate bucket name
   */
  private validateBucketName(bucketName: string): void {
    if (!bucketName || typeof bucketName !== 'string') {
      throw new BadRequestException('Invalid bucket name');
    }

    if (bucketName.length < 3 || bucketName.length > 63) {
      throw new BadRequestException('Bucket name must be between 3 and 63 characters');
    }

    // Basic bucket name validation (simplified)
    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucketName)) {
      throw new BadRequestException('Invalid bucket name format');
    }
  }

  /**
   * Validate file name
   */
  private validateFileName(fileName: string): void {
    if (!fileName || typeof fileName !== 'string') {
      throw new BadRequestException('Invalid file name');
    }

    if (fileName.length > 1024) {
      throw new BadRequestException('File name too long');
    }

    // Check for invalid characters
    if (/[<>:"|?*]/.test(fileName)) {
      throw new BadRequestException('File name contains invalid characters');
    }
  }
}

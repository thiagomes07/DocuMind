import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(private configService: ConfigService) {
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: this.configService.get<string>('storage.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('storage.accessKeyId'),
        secretAccessKey: this.configService.get<string>(
          'storage.secretAccessKey',
        ),
      },
    });

    this.bucket = this.configService.get<string>('storage.bucket');
    this.prefix = this.configService.get<string>('storage.prefix');

    this.logger.log(
      `✅ S3 Storage initialized: ${this.bucket} (${this.prefix})`,
    );
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      this.logger.debug(`Uploading file to S3: ${key}`);

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      this.logger.log(`✅ File uploaded successfully: ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${key}`, error);
      throw new InternalServerErrorException('Erro ao fazer upload do arquivo');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`✅ File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${key}`, error);
      // Don't throw - deletion failures shouldn't block operations
    }
  }

  /**
   * Get signed URL for file download (1 hour expiration)
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    try {
      const expiration =
        expiresIn ||
        this.configService.get<number>('storage.signedUrlExpiration');

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiration,
      });

      this.logger.debug(`Generated signed URL for: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${key}`, error);
      throw new InternalServerErrorException('Erro ao gerar URL de download');
    }
  }

  /**
   * Download file from S3 as buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      this.logger.debug(`Downloading file from S3: ${key}`);

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);

      this.logger.debug(`✅ File downloaded: ${key} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file from S3: ${key}`, error);
      throw new InternalServerErrorException('Erro ao baixar arquivo');
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Generate thumbnail for image
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    key: string,
  ): Promise<string> {
    try {
      this.logger.debug(`Generating thumbnail for: ${key}`);

      const thumbnailConfig = this.configService.get('storage.thumbnail');

      // Resize image using sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(thumbnailConfig.width, thumbnailConfig.height, {
          fit: thumbnailConfig.fit,
          position: 'center',
        })
        .jpeg({ quality: thumbnailConfig.quality })
        .toBuffer();

      // Upload thumbnail
      await this.uploadFile(key, thumbnailBuffer, 'image/jpeg');

      this.logger.log(`✅ Thumbnail generated: ${key}`);
      return key;
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${key}`, error);
      // Don't throw - thumbnail generation is not critical
      return null;
    }
  }

  /**
   * Build S3 key for document
   */
  buildDocumentKey(
    userId: string,
    documentId: string,
    extension: string,
  ): string {
    const keyPatterns = this.configService.get('storage.keyPatterns');
    return keyPatterns.document(userId, documentId, extension);
  }

  /**
   * Build S3 key for thumbnail
   */
  buildThumbnailKey(userId: string, documentId: string): string {
    const keyPatterns = this.configService.get('storage.keyPatterns');
    return keyPatterns.thumbnail(userId, documentId);
  }

  /**
   * Extract file extension from filename
   */
  getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Get file extension from MIME type
   */
  getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'application/pdf': 'pdf',
    };

    return mimeMap[mimeType] || 'bin';
  }

  /**
   * Validate if MIME type is allowed
   */
  isAllowedMimeType(mimeType: string): boolean {
    const allowedTypes = this.configService.get<string[]>(
      'storage.allowedMimeTypes',
    );
    return allowedTypes.includes(mimeType);
  }

  /**
   * Check if file is an image
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a PDF
   */
  isPdf(mimeType: string): boolean {
    return mimeType === 'application/pdf';
  }
}
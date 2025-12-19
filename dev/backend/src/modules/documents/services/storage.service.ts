import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export enum StorageProvider {
  LOCAL = 'local',
  S3 = 's3',
  CLOUDINARY = 'cloudinary',
}

export interface UploadResult {
  url: string;
  key: string;
  provider: StorageProvider;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;
  private readonly s3Client: S3Client | null = null;
  private readonly localStoragePath: string;

  constructor(private configService: ConfigService) {
    const configuredProvider = this.configService.get<StorageProvider>('STORAGE_PROVIDER', StorageProvider.LOCAL);
    this.localStoragePath = this.configService.get<string>('LOCAL_STORAGE_PATH', './uploads');

    // Validate Cloudinary is not used (not implemented)
    if (configuredProvider === StorageProvider.CLOUDINARY) {
      throw new Error(
        'Cloudinary storage provider is not yet implemented. Please use "local" or "s3" as STORAGE_PROVIDER.'
      );
    }

    if (configuredProvider === StorageProvider.S3) {
      const region = this.configService.get<string>('AWS_REGION');
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

      if (region && accessKeyId && secretAccessKey) {
        this.s3Client = new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.provider = StorageProvider.S3;
        this.logger.log('S3 storage initialized');
      } else {
        this.logger.warn('S3 credentials not found, falling back to local storage');
        this.provider = StorageProvider.LOCAL;
      }
    } else {
      this.provider = StorageProvider.LOCAL;
    }

    if (this.provider === StorageProvider.LOCAL) {
      this.ensureLocalStorageDirectory();
    }
  }

  private async ensureLocalStorageDirectory(): Promise<void> {
    try {
      await mkdir(this.localStoragePath, { recursive: true });
      this.logger.log(`Local storage directory ensured: ${this.localStoragePath}`);
    } catch (error) {
      this.logger.error('Failed to create local storage directory', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'documents',
  ): Promise<UploadResult> {
    const timestamp = Date.now();
    const sanitizedFilename = this.sanitizeFilename(file.originalname);
    const key = `${folder}/${timestamp}-${sanitizedFilename}`;

    switch (this.provider) {
      case StorageProvider.S3:
        return this.uploadToS3(file, key);
      case StorageProvider.CLOUDINARY:
        return this.uploadToCloudinary(file, key);
      case StorageProvider.LOCAL:
      default:
        return this.uploadToLocal(file, key);
    }
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    const filePath = path.join(this.localStoragePath, key);
    const directory = path.dirname(filePath);

    await mkdir(directory, { recursive: true });
    await writeFile(filePath, file.buffer);

    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    const url = `${baseUrl}/api/documents/files/${key}`;

    this.logger.log(`File uploaded to local storage: ${key}`);

    return {
      url,
      key,
      provider: StorageProvider.LOCAL,
    };
  }

  private async uploadToS3(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const url = `https://${bucket}.s3.amazonaws.com/${key}`;

    this.logger.log(`File uploaded to S3: ${key}`);

    return {
      url,
      key,
      provider: StorageProvider.S3,
    };
  }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    key: string,
  ): Promise<UploadResult> {
    throw new Error('Cloudinary storage not yet implemented');
  }

  async deleteFile(key: string, provider: StorageProvider): Promise<void> {
    switch (provider) {
      case StorageProvider.S3:
        return this.deleteFromS3(key);
      case StorageProvider.CLOUDINARY:
        return this.deleteFromCloudinary(key);
      case StorageProvider.LOCAL:
      default:
        return this.deleteFromLocal(key);
    }
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const filePath = path.join(this.localStoragePath, key);
    try {
      await unlink(filePath);
      this.logger.log(`File deleted from local storage: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from local storage: ${key}`, error);
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`File deleted from S3: ${key}`);
  }

  private async deleteFromCloudinary(key: string): Promise<void> {
    throw new Error('Cloudinary storage not yet implemented');
  }

  async getSignedDownloadUrl(key: string, provider: StorageProvider, expiresIn: number = 3600): Promise<string> {
    if (provider === StorageProvider.S3 && this.s3Client) {
      const bucket = this.configService.get<string>('AWS_S3_BUCKET');
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return getSignedUrl(this.s3Client, command, { expiresIn });
    }

    const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
    return `${baseUrl}/api/documents/files/${key}`;
  }

  getLocalFilePath(key: string): string {
    return path.join(this.localStoragePath, key);
  }

  /**
   * Resolve a file path for OCR processing
   * Handles both local files and remote S3 files by downloading to temp
   */
  async getLocalPath(fileUrl: string): Promise<string | null> {
    try {
      // Check if it's a local file URL
      if (fileUrl.includes('/api/documents/files/')) {
        // Extract the key from the URL
        const urlParts = fileUrl.split('/api/documents/files/');
        if (urlParts.length > 1) {
          const key = urlParts[1];
          const localPath = this.getLocalFilePath(key);
          
          // Verify file exists
          if (fs.existsSync(localPath)) {
            return localPath;
          }
        }
      }

      // Check if it's an S3 URL
      if (fileUrl.includes('s3.amazonaws.com') || fileUrl.includes('amazonaws.com')) {
        return await this.downloadS3FileToTemp(fileUrl);
      }

      // If it's a direct path, verify it exists
      if (fs.existsSync(fileUrl)) {
        return fileUrl;
      }

      this.logger.warn(`Could not resolve file path for URL: ${fileUrl}`);
      return null;
    } catch (error) {
      this.logger.error('Error resolving local path for OCR', error);
      return null;
    }
  }

  /**
   * Download S3 file to temporary location for processing
   */
  private async downloadS3FileToTemp(s3Url: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET not configured');
    }

    // Extract key from S3 URL
    const urlParts = s3Url.split(`${bucket}.s3.amazonaws.com/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid S3 URL format');
    }
    const key = urlParts[1];

    // Create temp directory if it doesn't exist
    const tempDir = path.join(this.localStoragePath, 'temp');
    await mkdir(tempDir, { recursive: true });

    // Generate temp file path
    const tempFileName = `temp-${Date.now()}-${path.basename(key)}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    // Download from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as any;
    
    // Write to temp file
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(tempFilePath);
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    this.logger.log(`Downloaded S3 file to temp: ${tempFilePath}`);
    return tempFilePath;
  }

  /**
   * Clean up temporary files created for OCR processing
   */
  async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (/[\\/]temp[\\/]/.test(filePath) && fs.existsSync(filePath)) {
        await unlink(filePath);
        this.logger.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up temp file', error);
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }
}

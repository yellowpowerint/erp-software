import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as mime from "mime-types";

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly defaultMaxSize: number;
  private readonly defaultAllowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    this.defaultMaxSize = this.configService.get<number>(
      "MAX_FILE_SIZE",
      10 * 1024 * 1024,
    ); // 10MB
    this.defaultAllowedMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "text/plain",
      "text/csv",
      "application/zip",
      "application/x-zip-compressed",
    ];
  }

  validateFile(
    file: Express.Multer.File,
    options: FileValidationOptions = {},
  ): void {
    const maxSize = options.maxSizeBytes || this.defaultMaxSize;
    const allowedMimeTypes =
      options.allowedMimeTypes || this.defaultAllowedMimeTypes;
    const allowedExtensions = options.allowedExtensions;

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
      );
    }

    // Validate MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
      );
    }

    // Validate file extension if specified
    if (allowedExtensions && allowedExtensions.length > 0) {
      const extension = this.getFileExtension(file.originalname);
      if (!allowedExtensions.includes(extension)) {
        throw new BadRequestException(
          `File extension .${extension} is not allowed. Allowed extensions: ${allowedExtensions.map((ext) => `.${ext}`).join(", ")}`,
        );
      }
    }

    // Additional security check: verify MIME type matches extension
    const extension = this.getFileExtension(file.originalname);
    const expectedMimeType = mime.lookup(extension);
    if (expectedMimeType && expectedMimeType !== file.mimetype) {
      this.logger.warn(
        `MIME type mismatch: file extension suggests ${expectedMimeType} but got ${file.mimetype}`,
      );
    }

    this.logger.log(
      `File validated: ${file.originalname} (${file.mimetype}, ${this.formatFileSize(file.size)})`,
    );
  }

  validateMultipleFiles(
    files: Express.Multer.File[],
    options: FileValidationOptions = {},
  ): void {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const maxFiles = this.configService.get<number>("MAX_FILES_PER_UPLOAD", 10);
    if (files.length > maxFiles) {
      throw new BadRequestException(
        `Too many files. Maximum ${maxFiles} files allowed per upload`,
      );
    }

    files.forEach((file, index) => {
      try {
        this.validateFile(file, options);
      } catch (error) {
        throw new BadRequestException(
          `File ${index + 1} (${file.originalname}): ${error.message}`,
        );
      }
    });
  }

  sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    const basename = filename.replace(/^.*[\\\/]/, "");

    // Remove or replace dangerous characters
    return basename
      .replace(/[<>:"|?*]/g, "")
      .replace(/\s+/g, "_")
      .replace(/_{2,}/g, "_")
      .trim();
  }

  getFileExtension(filename: string): string {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  }

  getMimeType(filename: string): string | false {
    return mime.lookup(filename);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  getFileSizeInMB(bytes: number): number {
    return parseFloat((bytes / (1024 * 1024)).toFixed(2));
  }

  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith("image/");
  }

  isPdfFile(mimetype: string): boolean {
    return mimetype === "application/pdf";
  }

  isDocumentFile(mimetype: string): boolean {
    const documentMimeTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ];
    return documentMimeTypes.includes(mimetype);
  }

  async scanForVirus(file: Express.Multer.File): Promise<boolean> {
    // Placeholder for virus scanning integration
    // In production, integrate with ClamAV or similar service
    this.logger.log(`Virus scan placeholder for file: ${file.originalname}`);
    return true;
  }
}

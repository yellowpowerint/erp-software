import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { StorageService } from './storage.service';
import { DocumentPermissionsService } from './document-permissions.service';
import { SecurityService } from './security.service';
import { PdfManipulatorService } from './pdf-manipulator.service';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';

const DocumentFinalizeStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

type DocumentFinalizeStatus = (typeof DocumentFinalizeStatus)[keyof typeof DocumentFinalizeStatus];

export type FinalizeJobOptions = {
  fileName?: string;
  cleanup?: {
    rasterize?: boolean;
    density?: number;
    jpegQuality?: number;
    grayscale?: boolean;
    sharpen?: boolean;
    normalize?: boolean;
  };
  redactions?: Array<{ page: number; x: number; y: number; width: number; height: number }>;
  security?: {
    hasWatermark?: boolean;
    watermarkText?: string;
    allowPrint?: boolean;
    allowCopy?: boolean;
    isPasswordProtected?: boolean;
    password?: string;
  };
};

@Injectable()
export class DocumentFinalizeService {
  private readonly logger = new Logger(DocumentFinalizeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly documentPermissionsService: DocumentPermissionsService,
    private readonly securityService: SecurityService,
    private readonly pdfManipulatorService: PdfManipulatorService,
    private readonly configService: ConfigService,
  ) {}

  private computeFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private sanitizeFilename(name: string) {
    return (name || '').replace(/[^\w.-]/g, '_');
  }

  async startFinalize(documentId: string, userId: string, options: FinalizeJobOptions) {
    await this.documentPermissionsService.assertHasPermission(documentId, userId, 'edit');

    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.mimeType !== 'application/pdf') {
      throw new BadRequestException('Only PDF documents can be finalized');
    }

    const job = await (this.prisma as any).documentFinalizeJob.create({
      data: {
        documentId,
        status: DocumentFinalizeStatus.PENDING,
        options: options || {},
        createdById: userId,
      },
    });

    return job;
  }

  async getJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).documentFinalizeJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Finalize job not found');
    }

    await this.documentPermissionsService.assertHasPermission(job.documentId, userId, 'view');
    return job;
  }

  async listDocumentJobs(documentId: string, userId: string) {
    await this.documentPermissionsService.assertHasPermission(documentId, userId, 'view');

    return (this.prisma as any).documentFinalizeJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).documentFinalizeJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Finalize job not found');
    }

    await this.documentPermissionsService.assertHasPermission(job.documentId, userId, 'edit');

    if (job.status !== DocumentFinalizeStatus.PENDING && job.status !== DocumentFinalizeStatus.PROCESSING) {
      throw new BadRequestException('Only pending or processing jobs can be cancelled');
    }

    await (this.prisma as any).documentFinalizeJob.update({
      where: { id: jobId },
      data: {
        status: DocumentFinalizeStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return { success: true };
  }

  async claimNextJob(): Promise<{ id: string } | null> {
    const candidates = await (this.prisma as any).documentFinalizeJob.findMany({
      where: {
        status: DocumentFinalizeStatus.PENDING,
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    for (const c of candidates) {
      const updated = await (this.prisma as any).documentFinalizeJob.updateMany({
        where: {
          id: c.id,
          status: DocumentFinalizeStatus.PENDING,
          attempts: { lt: c.maxAttempts },
        },
        data: {
          status: DocumentFinalizeStatus.PROCESSING,
          startedAt: new Date(),
          attempts: { increment: 1 },
          errorMessage: null,
        },
      });

      if (updated?.count === 1) {
        return { id: c.id };
      }
    }

    return null;
  }

  async recoverStuckJobs(stuckMinutes: number) {
    const threshold = new Date(Date.now() - Math.max(5, stuckMinutes) * 60_000);

    await (this.prisma as any).documentFinalizeJob.updateMany({
      where: {
        status: DocumentFinalizeStatus.PROCESSING,
        startedAt: { lt: threshold },
      },
      data: {
        status: DocumentFinalizeStatus.PENDING,
        startedAt: null,
      },
    });
  }

  async processJob(jobId: string): Promise<void> {
    const startTime = Date.now();

    const job = await (this.prisma as any).documentFinalizeJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return;
    }

    if (job.status === DocumentFinalizeStatus.CANCELLED) {
      return;
    }

    const document = await this.prisma.document.findUnique({ where: { id: job.documentId } });
    if (!document) {
      await (this.prisma as any).documentFinalizeJob.update({
        where: { id: jobId },
        data: {
          status: DocumentFinalizeStatus.FAILED,
          errorMessage: 'Document not found',
          completedAt: new Date(),
        },
      });
      return;
    }

    if (document.mimeType !== 'application/pdf') {
      await (this.prisma as any).documentFinalizeJob.update({
        where: { id: jobId },
        data: {
          status: DocumentFinalizeStatus.FAILED,
          errorMessage: 'Only PDF documents can be finalized',
          completedAt: new Date(),
        },
      });
      return;
    }

    const options: FinalizeJobOptions = (job.options as any) || {};

    const localPath = await this.storageService.getLocalPath(document.fileUrl);
    if (!localPath) {
      await (this.prisma as any).documentFinalizeJob.update({
        where: { id: jobId },
        data: {
          status: DocumentFinalizeStatus.FAILED,
          errorMessage: 'Document file not accessible',
          completedAt: new Date(),
        },
      });
      return;
    }

    const isTemp = /[\\/]temp[\\/]/.test(localPath);

    try {
      const inputBuffer = await fs.readFile(localPath);

      let outputBuffer = inputBuffer;

      const cleanup = options.cleanup || {};
      const redactions = Array.isArray(options.redactions) ? options.redactions : [];

      const density = Number.isFinite(cleanup.density) ? (cleanup.density as number) : 200;
      const jpegQuality = Number.isFinite(cleanup.jpegQuality) ? (cleanup.jpegQuality as number) : 75;

      if (redactions.length > 0) {
        outputBuffer = Buffer.from(
          await this.pdfManipulatorService.redactByRasterize(outputBuffer, {
            redactions,
            density,
            grayscale: !!cleanup.grayscale,
            sharpen: !!cleanup.sharpen,
            normalize: !!cleanup.normalize,
          } as any),
        );
      }

      if (cleanup.rasterize) {
        outputBuffer = Buffer.from(
          await this.pdfManipulatorService.compress(outputBuffer, {
            rasterize: true,
            density,
            jpegQuality,
            grayscale: !!cleanup.grayscale,
            sharpen: !!cleanup.sharpen,
            normalize: !!cleanup.normalize,
          } as any),
        );
      }

      const security = options.security || {};
      const watermarkText = (security.hasWatermark ? security.watermarkText : '') || '';

      if (watermarkText.trim()) {
        outputBuffer = Buffer.from(
          await this.pdfManipulatorService.watermark(outputBuffer, {
            text: watermarkText,
          }),
        );
      }

      const outNameRaw = options.fileName || `finalized-${document.id}.pdf`;
      const outputFileName = this.sanitizeFilename(outNameRaw);

      const upload = await this.storageService.uploadBuffer(
        outputBuffer,
        outputFileName,
        'application/pdf',
        document.module,
      );

      const outputFileHash = this.computeFileHash(outputBuffer);

      await this.prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: document.version,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          fileSize: document.fileSize,
          uploadedById: document.uploadedById,
          changeNotes: 'Previous version archived',
        },
      });

      const newVersion = document.version + 1;

      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          fileName: upload.key,
          originalName: outputFileName,
          fileSize: outputBuffer.length,
          mimeType: 'application/pdf',
          fileUrl: upload.url,
          fileHash: outputFileHash,
          version: newVersion,
          updatedAt: new Date(),
        },
      });

      const latestSeal = await (this.prisma as any).documentIntegritySeal.findFirst({
        where: { documentId: document.id },
        orderBy: { versionNumber: 'desc' },
      });

      const seal = await (this.prisma as any).documentIntegritySeal.create({
        data: {
          documentId: document.id,
          versionNumber: newVersion,
          algorithm: 'sha256',
          hash: outputFileHash,
          previousHash: latestSeal?.hash || null,
          metadata: {
            jobId,
            generatedAt: new Date().toISOString(),
            options,
            outputFileName,
            outputFileSize: outputBuffer.length,
            processingMs: Date.now() - startTime,
          },
          createdById: job.createdById,
        },
      });

      await this.securityService.setDocumentSecurity(document.id, job.createdById, {
        hasWatermark: !!security.hasWatermark,
        watermarkText: security.watermarkText,
        allowPrint: security.allowPrint,
        allowCopy: security.allowCopy,
        isPasswordProtected: security.isPasswordProtected,
        password: security.password,
      });

      await (this.prisma as any).documentFinalizeJob.update({
        where: { id: jobId },
        data: {
          status: DocumentFinalizeStatus.COMPLETED,
          outputFileUrl: upload.url,
          outputFileName,
          outputFileSize: outputBuffer.length,
          outputFileHash,
          integritySealId: seal.id,
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      this.logger.log(`Finalize completed for document ${document.id} (job ${jobId})`);
    } catch (error: any) {
      const latestJob = await (this.prisma as any).documentFinalizeJob.findUnique({ where: { id: jobId } });
      const attempts = latestJob?.attempts ?? job.attempts ?? 0;
      const maxAttempts = latestJob?.maxAttempts ?? job.maxAttempts ?? 3;
      const shouldRetry = attempts < maxAttempts;

      await (this.prisma as any).documentFinalizeJob.update({
        where: { id: jobId },
        data: {
          status: shouldRetry ? DocumentFinalizeStatus.PENDING : DocumentFinalizeStatus.FAILED,
          errorMessage: error?.message || 'Finalize failed',
          completedAt: shouldRetry ? null : new Date(),
        },
      });

      if (!shouldRetry) {
        this.logger.error(`Finalize failed for job ${jobId}: ${error?.message || error}`);
      }

      throw error;
    } finally {
      if (isTemp) {
        await this.storageService.cleanupTempFile(localPath);
      }
    }
  }
}

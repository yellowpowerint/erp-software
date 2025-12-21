import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { OCRService } from "./ocr.service";
import { StorageService } from "./storage.service";
import { OCRStatus } from "@prisma/client";

interface QueuedJob {
  id: string;
  documentId: string;
  filePath: string;
  userId: string;
  options: any;
  retries: number;
}

@Injectable()
export class OCRQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OCRQueueService.name);
  private queue: QueuedJob[] = [];
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly maxConcurrent = 3;
  private readonly maxRetries = 3;
  private activeJobs = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ocrService: OCRService,
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit() {
    this.logger.log("OCR Queue Service initialized");
    this.startProcessing();
    await this.recoverPendingJobs();
  }

  async onModuleDestroy() {
    this.stopProcessing();
  }

  /**
   * Add job to queue
   */
  async enqueueJob(
    jobId: string,
    documentId: string,
    userId: string,
    options: any = {},
  ): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    const filePath = await this.storageService.getLocalPath(document.fileUrl);
    if (!filePath) {
      throw new Error("Document file not accessible");
    }

    this.queue.push({
      id: jobId,
      documentId,
      filePath,
      userId,
      options,
      retries: 0,
    });

    this.logger.log(`Job ${jobId} enqueued for document ${documentId}`);
    this.processQueue();
  }

  /**
   * Start queue processing
   */
  private startProcessing() {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 2000); // Check queue every 2 seconds

    this.logger.log("Queue processing started");
  }

  /**
   * Stop queue processing
   */
  private stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.log("Queue processing stopped");
    }
  }

  /**
   * Process queued jobs
   */
  private async processQueue() {
    if (
      this.processing ||
      this.queue.length === 0 ||
      this.activeJobs >= this.maxConcurrent
    ) {
      return;
    }

    this.processing = true;

    try {
      const config = await this.ocrService.getOCRConfiguration();
      const maxJobs = Math.min(
        config.maxConcurrentJobs || this.maxConcurrent,
        this.maxConcurrent,
      );

      while (this.queue.length > 0 && this.activeJobs < maxJobs) {
        const job = this.queue.shift();
        if (job) {
          this.activeJobs++;
          this.processJob(job).finally(() => {
            this.activeJobs--;
          });
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process individual job
   */
  private async processJob(job: QueuedJob): Promise<void> {
    const isTempFile = /[\\/]temp[\\/]/.test(job.filePath);

    try {
      this.logger.log(
        `Processing job ${job.id} for document ${job.documentId}`,
      );

      await this.ocrService.processOCRJob(
        job.id,
        job.filePath,
        job.userId,
        job.options,
      );

      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);

      // Retry logic
      if (job.retries < this.maxRetries) {
        job.retries++;
        this.queue.push(job);
        this.logger.log(
          `Job ${job.id} requeued (retry ${job.retries}/${this.maxRetries})`,
        );
      } else {
        this.logger.error(
          `Job ${job.id} failed after ${this.maxRetries} retries`,
        );
      }
    } finally {
      // Cleanup temp file
      if (isTempFile) {
        await this.storageService.cleanupTempFile(job.filePath);
      }
    }
  }

  /**
   * Recover pending jobs from database on startup
   */
  private async recoverPendingJobs() {
    try {
      const pendingJobs = await this.prisma.oCRJob.findMany({
        where: {
          status: {
            in: [OCRStatus.PENDING, OCRStatus.PROCESSING],
          },
        },
        take: 50,
      });

      for (const job of pendingJobs) {
        const document = await this.prisma.document.findUnique({
          where: { id: job.documentId },
        });
        if (!document) continue;

        const filePath = await this.storageService.getLocalPath(
          document.fileUrl,
        );
        if (filePath) {
          this.queue.push({
            id: job.id,
            documentId: job.documentId,
            filePath,
            userId: job.createdById,
            options: {
              language: job.language,
              provider: job.provider,
              autoRotate: job.autoRotate,
              enhanceImage: job.enhanceImage,
            },
            retries: 0,
          });
        }
      }

      if (pendingJobs.length > 0) {
        this.logger.log(`Recovered ${pendingJobs.length} pending jobs`);
      }
    } catch (error) {
      this.logger.error("Failed to recover pending jobs", error);
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

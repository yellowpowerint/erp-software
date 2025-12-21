import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { DocumentConversionService } from "./document-conversion.service";

const DocumentConversionStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

@Injectable()
export class DocumentConversionQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DocumentConversionQueueService.name);
  private processingInterval: NodeJS.Timeout | null = null;
  private processing = false;
  private activeJobs = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversionService: DocumentConversionService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled =
      this.configService.get<string>("CONVERSION_WORKER_ENABLED", "true") ===
      "true";
    if (!enabled) {
      return;
    }

    this.logger.log("Document Conversion Queue Service initialized");
    await this.recoverStuckJobs();
    this.startProcessing();
  }

  async onModuleDestroy() {
    this.stopProcessing();
  }

  private startProcessing() {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 2000);
  }

  private stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  private getMaxConcurrent(): number {
    const v = this.configService.get<string>(
      "CONVERSION_WORKER_CONCURRENCY",
      "2",
    );
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      return 2;
    }
    return Math.min(5, Math.max(1, n));
  }

  private async processQueue() {
    if (this.processing) {
      return;
    }

    const maxConcurrent = this.getMaxConcurrent();
    if (this.activeJobs >= maxConcurrent) {
      return;
    }

    this.processing = true;

    try {
      while (this.activeJobs < maxConcurrent) {
        const job = await this.claimNextJob();
        if (!job) {
          return;
        }

        this.activeJobs++;
        this.conversionService
          .processJob(job.id)
          .catch(() => undefined)
          .finally(() => {
            this.activeJobs--;
          });
      }
    } finally {
      this.processing = false;
    }
  }

  private async claimNextJob(): Promise<{ id: string } | null> {
    const candidates = await (
      this.prisma as any
    ).documentConversionJob.findMany({
      where: {
        status: DocumentConversionStatus.PENDING,
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    for (const c of candidates) {
      const updated = await (
        this.prisma as any
      ).documentConversionJob.updateMany({
        where: {
          id: c.id,
          status: DocumentConversionStatus.PENDING,
          attempts: { lt: c.maxAttempts },
        },
        data: {
          status: DocumentConversionStatus.PROCESSING,
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

  private async recoverStuckJobs() {
    try {
      const minutes = Number(
        this.configService.get<string>("CONVERSION_WORKER_STUCK_MINUTES", "30"),
      );
      const threshold = new Date(Date.now() - Math.max(5, minutes) * 60_000);

      const result = await (
        this.prisma as any
      ).documentConversionJob.updateMany({
        where: {
          status: DocumentConversionStatus.PROCESSING,
          startedAt: { lt: threshold },
        },
        data: {
          status: DocumentConversionStatus.PENDING,
          startedAt: null,
        },
      });

      if (result?.count > 0) {
        this.logger.warn(`Recovered ${result.count} stuck conversion jobs`);
      }
    } catch (error) {
      this.logger.error(
        "Failed to recover stuck conversion jobs",
        error as any,
      );
    }
  }
}

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentFinalizeService } from "./document-finalize.service";

@Injectable()
export class DocumentFinalizeQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DocumentFinalizeQueueService.name);
  private processingInterval: NodeJS.Timeout | null = null;
  private processing = false;
  private activeJobs = 0;

  constructor(
    private readonly finalizeService: DocumentFinalizeService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled =
      this.configService.get<string>("FINALIZE_WORKER_ENABLED", "true") ===
      "true";
    if (!enabled) {
      return;
    }

    this.logger.log("Document Finalize Queue Service initialized");
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
      "FINALIZE_WORKER_CONCURRENCY",
      "1",
    );
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) {
      return 1;
    }
    return Math.min(3, Math.max(1, n));
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
        const job = await this.finalizeService.claimNextJob();
        if (!job) {
          return;
        }

        this.activeJobs++;
        this.finalizeService
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

  private async recoverStuckJobs() {
    try {
      const minutes = Number(
        this.configService.get<string>("FINALIZE_WORKER_STUCK_MINUTES", "30"),
      );
      await this.finalizeService.recoverStuckJobs(minutes);
    } catch (error) {
      this.logger.error("Failed to recover stuck finalize jobs", error as any);
    }
  }
}

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CsvService } from "./csv.service";

@Injectable()
export class CsvExportQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CsvExportQueueService.name);
  private processingInterval: NodeJS.Timeout | null = null;
  private processing = false;
  private activeJobs = 0;

  constructor(
    private readonly csvService: CsvService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled =
      this.configService.get<string>("CSV_EXPORT_WORKER_ENABLED", "true") ===
      "true";
    if (!enabled) {
      return;
    }

    this.logger.log("CSV Export Queue Service initialized");
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
      "CSV_EXPORT_WORKER_CONCURRENCY",
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
        const job = await this.csvService.claimNextExportJob();
        if (!job) {
          return;
        }

        this.activeJobs++;
        this.csvService
          .processExportJob(job.id)
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
        this.configService.get<string>("CSV_EXPORT_WORKER_STUCK_MINUTES", "30"),
      );
      await this.csvService.recoverStuckExportJobs(minutes);
    } catch (error) {
      this.logger.error("Failed to recover stuck export jobs", error as any);
    }
  }
}

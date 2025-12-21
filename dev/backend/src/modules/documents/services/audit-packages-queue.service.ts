import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditPackagesService } from "./audit-packages.service";

@Injectable()
export class AuditPackagesQueueService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuditPackagesQueueService.name);
  private processingInterval: NodeJS.Timeout | null = null;
  private processing = false;
  private activeJobs = 0;

  constructor(
    private readonly auditPackagesService: AuditPackagesService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled =
      this.configService.get<string>("AUDIT_PACKAGE_WORKER_ENABLED", "true") ===
      "true";
    if (!enabled) {
      return;
    }

    await this.recoverStuckJobs();
    this.startProcessing();
    this.logger.log("Audit Packages Queue Service initialized");
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
      "AUDIT_PACKAGE_WORKER_CONCURRENCY",
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
        const job = await this.auditPackagesService.claimNextJob();
        if (!job) {
          return;
        }

        this.activeJobs++;
        this.auditPackagesService
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
    const minutes = Number(
      this.configService.get<string>(
        "AUDIT_PACKAGE_WORKER_STUCK_MINUTES",
        "30",
      ),
    );
    try {
      await this.auditPackagesService.recoverStuckJobs(minutes);
    } catch (error) {
      this.logger.error(
        "Failed to recover stuck audit package jobs",
        error as any,
      );
    }
  }

  getQueueStatus() {
    return {
      activeJobs: this.activeJobs,
      maxConcurrent: this.getMaxConcurrent(),
    };
  }
}

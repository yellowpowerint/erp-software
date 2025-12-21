import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ExportStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvService } from "./csv.service";
import { EmailService } from "./email.service";
import { StorageService } from "../documents/services/storage.service";
import * as fs from "fs/promises";
import CronExpressionParser from "cron-parser";

function isValidEmail(email: string): boolean {
  const s = String(email || "").trim();
  return !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function nextRunFromSchedule(now: Date, schedule: string): Date {
  const s = String(schedule || "").trim();
  const lowered = s.toLowerCase();

  // Friendly shortcuts
  if (lowered === "daily") {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
  if (lowered === "weekly") {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  if (lowered === "monthly") {
    const d = new Date(now);
    d.setMonth(d.getMonth() + 1);
    return d;
  }

  // Cron expression
  const interval = CronExpressionParser.parse(s, { currentDate: now } as any);
  return interval.next().toDate();
}

function validateSchedule(schedule: string): void {
  const s = String(schedule || "").trim();
  const lowered = s.toLowerCase();
  if (["daily", "weekly", "monthly"].includes(lowered)) {
    return;
  }

  // Throws if invalid
  CronExpressionParser.parse(s, { currentDate: new Date() } as any);
}

@Injectable()
export class ScheduledExportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledExportService.name);
  private timer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled =
      this.configService.get<string>(
        "CSV_SCHEDULED_EXPORTS_ENABLED",
        "true",
      ) === "true";
    if (!enabled) return;

    this.timer = setInterval(() => {
      this.tick().catch(() => undefined);
    }, 30_000);
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async createScheduledExport(
    payload: {
      name: string;
      module: string;
      filters?: any;
      columns: string[];
      context?: any;
      schedule: string;
      recipients: string[];
      format?: string;
      isActive?: boolean;
    },
    userId: string,
  ) {
    const recipients = (payload.recipients || [])
      .map((x) => String(x).trim())
      .filter(isValidEmail);
    if (!recipients.length) {
      throw new BadRequestException(
        "At least one valid recipient email is required",
      );
    }

    try {
      validateSchedule(payload.schedule);
    } catch (e: any) {
      throw new BadRequestException(
        `Invalid schedule: ${e?.message || "Invalid cron expression"}`,
      );
    }

    const now = new Date();
    const nextRunAt = nextRunFromSchedule(now, payload.schedule);

    return (this.prisma as any).scheduledExport.create({
      data: {
        name: payload.name,
        module: payload.module,
        filters: payload.filters ?? undefined,
        columns: payload.columns,
        context: payload.context ?? undefined,
        schedule: payload.schedule,
        recipients,
        format: payload.format ?? "csv",
        isActive: payload.isActive ?? true,
        nextRunAt,
        createdById: userId,
      },
    });
  }

  async listScheduledExports(userId: string) {
    return (this.prisma as any).scheduledExport.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async setActive(id: string, isActive: boolean, userId: string) {
    const existing = await (this.prisma as any).scheduledExport.findUnique({
      where: { id },
    });
    if (!existing || existing.createdById !== userId) {
      throw new BadRequestException("Scheduled export not found");
    }

    const now = new Date();
    let nextRunAt = existing.nextRunAt;
    if (isActive) {
      try {
        validateSchedule(existing.schedule);
      } catch (e: any) {
        throw new BadRequestException(
          `Invalid schedule: ${e?.message || "Invalid cron expression"}`,
        );
      }
      nextRunAt = nextRunFromSchedule(now, existing.schedule);
    }

    return (this.prisma as any).scheduledExport.update({
      where: { id },
      data: { isActive, nextRunAt },
    });
  }

  async getRuns(id: string, userId: string) {
    const existing = await (this.prisma as any).scheduledExport.findUnique({
      where: { id },
    });
    if (!existing || existing.createdById !== userId) {
      throw new BadRequestException("Scheduled export not found");
    }

    return (this.prisma as any).scheduledExportRun.findMany({
      where: { scheduledExportId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  private async tick() {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();

      const due = await (this.prisma as any).scheduledExport.findMany({
        where: {
          isActive: true,
          nextRunAt: { lte: now },
        },
        orderBy: { nextRunAt: "asc" },
        take: 5,
      });

      for (const s of due) {
        await this.runScheduledExport(s);
      }
    } finally {
      this.processing = false;
    }
  }

  private async runScheduledExport(s: any) {
    const now = new Date();

    const run = await (this.prisma as any).scheduledExportRun.create({
      data: {
        scheduledExportId: s.id,
        status: "PROCESSING",
      },
    });

    try {
      const fileName = `${s.module}-scheduled-${Date.now()}.csv`;
      const job = await this.csvService.createExportJob(
        s.module,
        s.filters || {},
        s.columns || [],
        s.createdById,
        fileName,
        s.context || undefined,
      );

      await (this.prisma as any).scheduledExportRun.update({
        where: { id: run.id },
        data: { exportJobId: job.id, status: "EXPORTING" },
      });

      // Process export immediately for scheduled delivery.
      await (this.prisma as any).exportJob.update({
        where: { id: job.id },
        data: { status: ExportStatus.PROCESSING },
      });
      await this.csvService.processExportJob(job.id);

      const updatedJob = await (this.prisma as any).exportJob.findUnique({
        where: { id: job.id },
      });
      if (
        !updatedJob ||
        updatedJob.status !== ExportStatus.COMPLETED ||
        !updatedJob.fileUrl
      ) {
        throw new BadRequestException(
          "Scheduled export failed to generate file",
        );
      }

      const localPath = await this.storageService.getLocalPath(
        updatedJob.fileUrl,
      );
      if (!localPath) {
        throw new BadRequestException(
          "Unable to resolve exported file for email",
        );
      }

      const buf = await fs.readFile(localPath);

      await (this.prisma as any).scheduledExportRun.update({
        where: { id: run.id },
        data: { status: "SENDING" },
      });

      await this.emailService.sendEmail({
        to: (s.recipients || [])
          .map((x: any) => String(x).trim())
          .filter(Boolean),
        subject: `Scheduled Export: ${s.name}`,
        text: `Your scheduled export "${s.name}" is attached. Generated at ${now.toISOString()}.`,
        attachments: [
          { filename: fileName, content: buf, contentType: "text/csv" },
        ],
      });

      await this.storageService.cleanupTempFile(localPath);

      const nextRunAt = nextRunFromSchedule(now, s.schedule);
      await (this.prisma as any).scheduledExport.update({
        where: { id: s.id },
        data: { lastRunAt: now, nextRunAt },
      });

      await (this.prisma as any).scheduledExportRun.update({
        where: { id: run.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      this.logger.log(`Scheduled export ${s.id} emailed export job ${job.id}`);
    } catch (e: any) {
      await (this.prisma as any).scheduledExportRun.update({
        where: { id: run.id },
        data: { status: "FAILED", errorMessage: e?.message || "Failed" },
      });
      this.logger.error("Scheduled export run failed", e as any);
    }
  }
}

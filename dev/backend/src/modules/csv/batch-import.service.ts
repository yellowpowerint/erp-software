import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { ImportStatus } from "@prisma/client";

@Injectable()
export class BatchImportService {
  constructor(private readonly prisma: PrismaService) {}

  async scheduleImport(jobId: string, scheduledTime: Date) {
    return (this.prisma as any).importJob.update({
      where: { id: jobId },
      data: {
        scheduledAt: scheduledTime,
        status: ImportStatus.PENDING,
        startedAt: null,
        completedAt: null,
      },
    });
  }

  async getQueueStatus() {
    const [pending, processing] = await Promise.all([
      (this.prisma as any).importJob.count({
        where: { status: ImportStatus.PENDING },
      }),
      (this.prisma as any).importJob.count({
        where: { status: ImportStatus.PROCESSING },
      }),
    ]);

    return { pending, processing };
  }
}

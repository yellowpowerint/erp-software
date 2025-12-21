import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class CsvAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    jobType: string,
    action: string,
    details?: any,
    opts?: { jobId?: string; createdById?: string },
  ) {
    const jobId = opts?.jobId ? String(opts.jobId) : undefined;
    const createdById = opts?.createdById
      ? String(opts.createdById)
      : undefined;

    return (this.prisma as any).csvAuditLog.create({
      data: {
        jobType,
        jobId,
        action,
        details: details ?? undefined,
        createdById,
      },
    });
  }

  async getAuditTrail(jobId: string) {
    return (this.prisma as any).csvAuditLog.findMany({
      where: { jobId: String(jobId) },
      orderBy: { createdAt: "asc" },
    });
  }

  async getStats(userId: string, isAdmin: boolean) {
    const importWhere = isAdmin ? {} : { createdById: userId };
    const exportWhere = isAdmin ? {} : { createdById: userId };

    const [importTotals, exportTotals] = await Promise.all([
      (this.prisma as any).importJob.groupBy({
        by: ["status"],
        where: importWhere,
        _count: true,
      }),
      (this.prisma as any).exportJob.groupBy({
        by: ["status"],
        where: exportWhere,
        _count: true,
      }),
    ]);

    return {
      imports: importTotals.map((x: any) => ({
        status: x.status,
        count: x._count,
      })),
      exports: exportTotals.map((x: any) => ({
        status: x.status,
        count: x._count,
      })),
    };
  }
}

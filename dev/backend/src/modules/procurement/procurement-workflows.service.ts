import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Prisma,
  ProcurementApprovalType,
  RequisitionType,
  UserRole,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  CreateProcurementWorkflowDto,
  UpdateProcurementWorkflowDto,
} from "./dto";

@Injectable()
export class ProcurementWorkflowsService {
  constructor(private prisma: PrismaService) {}

  private toDecimalOrNull(value?: string): Prisma.Decimal | null {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException("Invalid amount");
    }
    return new Prisma.Decimal(n);
  }

  async createWorkflow(
    dto: CreateProcurementWorkflowDto,
    user: { userId: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.CEO) {
      throw new ForbiddenException("Not allowed");
    }

    if (!dto.stages?.length) {
      throw new BadRequestException("Workflow must have at least one stage");
    }

    const stageNumbers = new Set<number>();
    for (const s of dto.stages) {
      if (stageNumbers.has(s.stageNumber)) {
        throw new BadRequestException("Duplicate stageNumber");
      }
      stageNumbers.add(s.stageNumber);
      if (!s.approverId && !s.approverRole) {
        throw new BadRequestException(
          `Stage ${s.stageNumber} must have approverRole or approverId`,
        );
      }
    }

    const minAmount = this.toDecimalOrNull(dto.minAmount ?? undefined);
    const maxAmount = this.toDecimalOrNull(dto.maxAmount ?? undefined);

    if (minAmount && maxAmount && minAmount.greaterThan(maxAmount)) {
      throw new BadRequestException(
        "minAmount cannot be greater than maxAmount",
      );
    }

    return this.prisma.procurementWorkflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type ?? null,
        isActive: dto.isActive ?? true,
        minAmount,
        maxAmount,
        createdById: user.userId,
        stages: {
          create: dto.stages
            .sort((a, b) => a.stageNumber - b.stageNumber)
            .map((s) => ({
              stageNumber: s.stageNumber,
              name: s.name,
              approverRole: s.approverRole ?? null,
              approverId: s.approverId ?? null,
              approvalType: s.approvalType ?? ProcurementApprovalType.SINGLE,
              escalationHours: s.escalationHours ?? null,
              escalateToId: s.escalateToId ?? null,
            })),
        },
      },
      include: {
        stages: { orderBy: { stageNumber: "asc" } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getWorkflows(user: { userId: string; role: UserRole }) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.CFO
    ) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.procurementWorkflow.findMany({
      include: {
        stages: { orderBy: { stageNumber: "asc" } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getWorkflowById(id: string, user: { userId: string; role: UserRole }) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.CEO &&
      user.role !== UserRole.CFO
    ) {
      throw new ForbiddenException("Not allowed");
    }

    const wf = await this.prisma.procurementWorkflow.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { stageNumber: "asc" } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
    if (!wf) throw new NotFoundException("Workflow not found");
    return wf;
  }

  async updateWorkflow(
    id: string,
    dto: UpdateProcurementWorkflowDto,
    user: { userId: string; role: UserRole },
  ) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.CEO) {
      throw new ForbiddenException("Not allowed");
    }

    const existing = await this.prisma.procurementWorkflow.findUnique({
      where: { id },
      include: { stages: true },
    });
    if (!existing) throw new NotFoundException("Workflow not found");

    const minAmount =
      dto.minAmount !== undefined
        ? this.toDecimalOrNull(dto.minAmount)
        : undefined;
    const maxAmount =
      dto.maxAmount !== undefined
        ? this.toDecimalOrNull(dto.maxAmount)
        : undefined;

    if (minAmount && maxAmount && minAmount.greaterThan(maxAmount)) {
      throw new BadRequestException(
        "minAmount cannot be greater than maxAmount",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.stages) {
        if (!dto.stages.length) {
          throw new BadRequestException(
            "Workflow must have at least one stage",
          );
        }

        const stageNumbers = new Set<number>();
        for (const s of dto.stages) {
          if (stageNumbers.has(s.stageNumber)) {
            throw new BadRequestException("Duplicate stageNumber");
          }
          stageNumbers.add(s.stageNumber);
          if (!s.approverId && !s.approverRole) {
            throw new BadRequestException(
              `Stage ${s.stageNumber} must have approverRole or approverId`,
            );
          }
        }

        await tx.procurementWorkflowStage.deleteMany({
          where: { workflowId: id },
        });

        await tx.procurementWorkflowStage.createMany({
          data: dto.stages
            .sort((a, b) => a.stageNumber - b.stageNumber)
            .map((s) => ({
              workflowId: id,
              stageNumber: s.stageNumber,
              name: s.name,
              approverRole: s.approverRole ?? null,
              approverId: s.approverId ?? null,
              approvalType: s.approvalType ?? ProcurementApprovalType.SINGLE,
              escalationHours: s.escalationHours ?? null,
              escalateToId: s.escalateToId ?? null,
            })),
        });
      }

      await tx.procurementWorkflow.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          type:
            dto.type === undefined
              ? undefined
              : (dto.type as RequisitionType | null),
          isActive: dto.isActive,
          minAmount: minAmount as any,
          maxAmount: maxAmount as any,
        },
      });

      return tx.procurementWorkflow.findUnique({
        where: { id },
        include: {
          stages: { orderBy: { stageNumber: "asc" } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      });
    });
  }

  async deleteWorkflow(id: string, user: { userId: string; role: UserRole }) {
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.CEO) {
      throw new ForbiddenException("Not allowed");
    }

    await this.prisma.procurementWorkflow.delete({ where: { id } });
    return { success: true };
  }

  async seedDefaultWorkflows(user: { userId: string; role: UserRole }) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Not allowed");
    }

    const existing = await this.prisma.procurementWorkflow.count();
    if (existing > 0) {
      return { created: 0 };
    }

    const workflows: Array<{
      name: string;
      description?: string;
      type?: RequisitionType;
      minAmount?: number;
      maxAmount?: number | null;
      stages: Array<{
        stageNumber: number;
        name: string;
        approverRole: UserRole;
      }>;
    }> = [
      {
        name: "Standard Requisition (< GH₵5,000)",
        minAmount: 0,
        maxAmount: 5000,
        stages: [
          {
            stageNumber: 1,
            name: "Department Head",
            approverRole: UserRole.DEPARTMENT_HEAD,
          },
          {
            stageNumber: 2,
            name: "Procurement Officer",
            approverRole: UserRole.PROCUREMENT_OFFICER,
          },
        ],
      },
      {
        name: "Medium Value (GH₵5,000 - GH₵50,000)",
        minAmount: 5000,
        maxAmount: 50000,
        stages: [
          {
            stageNumber: 1,
            name: "Department Head",
            approverRole: UserRole.DEPARTMENT_HEAD,
          },
          {
            stageNumber: 2,
            name: "Operations Manager",
            approverRole: UserRole.OPERATIONS_MANAGER,
          },
          { stageNumber: 3, name: "CFO", approverRole: UserRole.CFO },
        ],
      },
      {
        name: "High Value (> GH₵50,000)",
        minAmount: 50000,
        maxAmount: null,
        stages: [
          {
            stageNumber: 1,
            name: "Department Head",
            approverRole: UserRole.DEPARTMENT_HEAD,
          },
          {
            stageNumber: 2,
            name: "Operations Manager",
            approverRole: UserRole.OPERATIONS_MANAGER,
          },
          { stageNumber: 3, name: "CFO", approverRole: UserRole.CFO },
          { stageNumber: 4, name: "CEO", approverRole: UserRole.CEO },
        ],
      },
      {
        name: "Emergency Requisition",
        type: RequisitionType.EMERGENCY,
        stages: [
          {
            stageNumber: 1,
            name: "Operations Manager",
            approverRole: UserRole.OPERATIONS_MANAGER,
          },
        ],
      },
    ];

    let created = 0;
    for (const wf of workflows) {
      await this.prisma.procurementWorkflow.create({
        data: {
          name: wf.name,
          description: wf.description,
          type: wf.type ?? null,
          isActive: true,
          minAmount:
            wf.minAmount !== undefined
              ? new Prisma.Decimal(wf.minAmount)
              : null,
          maxAmount:
            wf.maxAmount === undefined
              ? null
              : wf.maxAmount === null
                ? null
                : new Prisma.Decimal(wf.maxAmount),
          createdById: user.userId,
          stages: {
            create: wf.stages.map((s) => ({
              stageNumber: s.stageNumber,
              name: s.name,
              approverRole: s.approverRole,
              approvalType: ProcurementApprovalType.SINGLE,
            })),
          },
        },
      });
      created += 1;
    }

    return { created };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateApprovalDelegationDto } from "./dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class ApprovalDelegationsService {
  constructor(private prisma: PrismaService) {}

  private canManageOthers(role: UserRole) {
    return (
      role === UserRole.SUPER_ADMIN ||
      role === UserRole.CEO ||
      role === UserRole.CFO
    );
  }

  async createDelegation(
    dto: CreateApprovalDelegationDto,
    user: { userId: string; role: UserRole },
  ) {
    const delegatorId = dto.delegatorId;

    if (delegatorId !== user.userId && !this.canManageOthers(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new BadRequestException("Invalid startDate");
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid endDate");
    }
    if (startDate >= endDate) {
      throw new BadRequestException("startDate must be before endDate");
    }

    if (dto.delegateId === delegatorId) {
      throw new BadRequestException("delegateId cannot equal delegatorId");
    }

    // Disable overlapping delegations for same delegator
    await this.prisma.approvalDelegation.updateMany({
      where: {
        delegatorId,
        isActive: true,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
      data: { isActive: false },
    });

    return this.prisma.approvalDelegation.create({
      data: {
        delegatorId,
        delegateId: dto.delegateId,
        startDate,
        endDate,
        reason: dto.reason,
        isActive: true,
      },
      include: {
        delegator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        delegate: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });
  }

  async getDelegations(user: { userId: string; role: UserRole }) {
    const where = this.canManageOthers(user.role)
      ? {}
      : {
          OR: [{ delegatorId: user.userId }, { delegateId: user.userId }],
        };

    return this.prisma.approvalDelegation.findMany({
      where,
      include: {
        delegator: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
        delegate: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async cancelDelegation(id: string, user: { userId: string; role: UserRole }) {
    const delegation = await this.prisma.approvalDelegation.findUnique({
      where: { id },
    });
    if (!delegation) throw new NotFoundException("Delegation not found");

    if (
      delegation.delegatorId !== user.userId &&
      !this.canManageOthers(user.role)
    ) {
      throw new ForbiddenException("Not allowed");
    }

    await this.prisma.approvalDelegation.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true };
  }

  async resolveDelegate(approverId: string, at: Date = new Date()) {
    const delegation = await this.prisma.approvalDelegation.findFirst({
      where: {
        delegatorId: approverId,
        isActive: true,
        startDate: { lte: at },
        endDate: { gte: at },
      },
      select: { delegateId: true },
    });

    return delegation?.delegateId || null;
  }
}

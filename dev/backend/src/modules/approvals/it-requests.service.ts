import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateITRequestDto, ApprovalActionDto } from "./dto";

@Injectable()
export class ITRequestsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createITRequest(userId: string, dto: CreateITRequestDto) {
    // Generate request number
    const count = await this.prisma.iTRequest.count();
    const requestNumber = `IT-${String(count + 1).padStart(6, "0")}`;

    const request = await this.prisma.iTRequest.create({
      data: {
        requestNumber,
        requestType: dto.requestType as any,
        title: dto.title,
        description: dto.description,
        justification: dto.justification,
        priority: dto.priority || "NORMAL",
        estimatedCost: dto.estimatedCost,
        currency: dto.currency || "GHS",
        createdById: userId,
        attachmentUrl: dto.attachmentUrl,
        notes: dto.notes,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Send notifications to IT Manager and CEO
    const creatorName = `${request.createdBy?.firstName || ""} ${request.createdBy?.lastName || ""}`;
    await this.notificationsService.notifyITRequestApprovers(
      request.id,
      request.requestNumber,
      request.title,
      creatorName,
    );

    return request;
  }

  async getITRequests(userId: string, userRole: string) {
    // IT Managers, CEOs, and CFOs see all
    // Others see only their own
    const canSeeAll = ["CEO", "CFO", "IT_MANAGER", "SUPER_ADMIN"].includes(
      userRole,
    );

    return this.prisma.iTRequest.findMany({
      where: canSeeAll ? {} : { createdById: userId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getITRequestById(id: string) {
    const request = await this.prisma.iTRequest.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException("IT request not found");
    }

    return request;
  }

  async approveITRequest(
    requestId: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    // Check if user can approve (IT_MANAGER, CEO, CFO)
    const canApprove = ["CEO", "CFO", "IT_MANAGER", "SUPER_ADMIN"].includes(
      userRole,
    );
    if (!canApprove) {
      throw new ForbiddenException(
        "You do not have permission to approve IT requests",
      );
    }

    // Get request
    const request = await this.getITRequestById(requestId);
    if (request.status !== "PENDING") {
      throw new ForbiddenException("IT request is not pending approval");
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: "IT_REQUEST",
        referenceId: requestId,
        itRequestId: requestId,
        approverId: userId,
        action: "APPROVED",
        comments: dto.comments,
      },
    });

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Update request status
    const updatedRequest = await this.prisma.iTRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Notify creator
    await this.notificationsService.notifyCreatorOfApproval(
      request.createdBy.id,
      true,
      "IT Request",
      request.requestNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedRequest;
  }

  async rejectITRequest(
    requestId: string,
    userId: string,
    userRole: string,
    dto: ApprovalActionDto,
  ) {
    // Check if user can reject (IT_MANAGER, CEO, CFO)
    const canReject = ["CEO", "CFO", "IT_MANAGER", "SUPER_ADMIN"].includes(
      userRole,
    );
    if (!canReject) {
      throw new ForbiddenException(
        "You do not have permission to reject IT requests",
      );
    }

    // Get request
    const request = await this.getITRequestById(requestId);
    if (request.status !== "PENDING") {
      throw new ForbiddenException("IT request is not pending approval");
    }

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        type: "IT_REQUEST",
        referenceId: requestId,
        itRequestId: requestId,
        approverId: userId,
        action: "REJECTED",
        comments: dto.comments,
      },
    });

    // Get approver info
    const approver = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Update request status
    const updatedRequest = await this.prisma.iTRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        approvalHistory: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Notify creator of rejection
    await this.notificationsService.notifyCreatorOfApproval(
      request.createdBy.id,
      false,
      "IT Request",
      request.requestNumber,
      `${approver.firstName} ${approver.lastName}`,
    );

    return updatedRequest;
  }
}

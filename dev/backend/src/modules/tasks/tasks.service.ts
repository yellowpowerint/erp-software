import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { TasksListQueryDto } from "./dto";
import { StorageService } from "../documents/services/storage.service";

type TaskListItem = {
  id: string;
  title: string;
  status: string;
  assignedTo: string | null;
  dueDate: Date | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  project: { id: string; name: string; projectCode: string | null };
};

type TasksListResponse = {
  items: TaskListItem[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  private canSeeAll(role: string) {
    return ["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER"].includes(String(role));
  }

  private getUserEmail(user: any): string {
    return String(user?.email ?? "").trim();
  }

  private getUserId(user: any): string {
    return String(user?.userId ?? user?.id ?? "").trim();
  }

  private async assertCanAccessTask(user: any, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (!this.canSeeAll(user?.role)) {
      const userEmail = this.getUserEmail(user);
      if (!userEmail) {
        throw new ForbiddenException("You do not have access to this task");
      }
      const assigned = String(task.assignedTo ?? "").trim();
      if (!assigned || assigned.toLowerCase() !== userEmail.toLowerCase()) {
        throw new ForbiddenException("You do not have access to this task");
      }
    }

    return task;
  }

  async listTasks(user: any, query: TasksListQueryDto): Promise<TasksListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const search = (query.search ?? "").trim();
    const hasSearch = search.length > 0;

    const userEmail = String(user?.email ?? "").trim();
    const mineRequested = query.mine === true;
    const mustBeMine = !this.canSeeAll(user?.role) || mineRequested;

    const where: any = {
      ...(query.status ? { status: String(query.status) } : {}),
      ...(mustBeMine && userEmail
        ? { assignedTo: { equals: userEmail, mode: "insensitive" } }
        : {}),
      ...(hasSearch
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { assignedTo: { contains: search, mode: "insensitive" } },
              { project: { name: { contains: search, mode: "insensitive" } } },
              { project: { projectCode: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    if (mustBeMine && !userEmail) {
      return { items: [], page, pageSize, total: 0, hasNextPage: false };
    }

    const [total, items] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, projectCode: true },
          },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      hasNextPage: skip + items.length < total,
    };
  }

  async getTaskById(user: any, id: string) {
    await this.assertCanAccessTask(user, id);

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, projectCode: true },
        },
        attachments: {
          orderBy: { uploadedAt: "desc" },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const assignedToEmail = String(task.assignedTo ?? "").trim();
    let assignedToName: string | undefined = undefined;
    let assignedToId: string | undefined = undefined;

    if (assignedToEmail) {
      const assignedUser = await this.prisma.user.findFirst({
        where: { email: { equals: assignedToEmail, mode: "insensitive" } },
        select: { id: true, firstName: true, lastName: true },
      });
      if (assignedUser) {
        assignedToId = assignedUser.id;
        assignedToName = `${assignedUser.firstName} ${assignedUser.lastName}`.trim();
      }
    }

    return {
      ...task,
      assignedToName,
      assignedToId,
      comments: task.comments.map((c) => ({
        id: c.id,
        authorName: `${c.author.firstName} ${c.author.lastName}`.trim(),
        content: c.content,
        createdAt: c.createdAt,
      })),
    };
  }

  async updateTaskStatus(user: any, taskId: string, status: string) {
    await this.assertCanAccessTask(user, taskId);

    const isCompleted = status === "COMPLETED";
    const completedAt = isCompleted ? new Date() : null;

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: status as any,
        isCompleted,
        completedAt,
      },
    });
  }

  async addTaskComment(user: any, taskId: string, content: string) {
    await this.assertCanAccessTask(user, taskId);

    const authorId = this.getUserId(user);
    if (!authorId) {
      throw new BadRequestException("User not found");
    }

    const comment = await this.prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        content,
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      id: comment.id,
      authorName: `${comment.author.firstName} ${comment.author.lastName}`.trim(),
      content: comment.content,
      createdAt: comment.createdAt,
    };
  }

  async updateTaskAssignment(user: any, taskId: string, assignedToId: string) {
    if (!this.canSeeAll(user?.role)) {
      throw new ForbiddenException("You do not have permission to reassign tasks");
    }

    await this.assertCanAccessTask(user, taskId);

    const assignee = await this.prisma.user.findUnique({
      where: { id: assignedToId },
      select: { email: true },
    });

    if (!assignee?.email) {
      throw new BadRequestException("Assignee not found");
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedTo: assignee.email,
      },
    });
  }

  async uploadAttachment(taskId: string, file: Express.Multer.File, userId: string) {
    if (!file) {
      throw new BadRequestException("File is required");
    }

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const upload = await this.storageService.uploadFile(file, "tasks");

    return this.prisma.taskAttachment.create({
      data: {
        taskId,
        filename: file.originalname,
        url: upload.url,
        size: file.size,
        uploadedById: userId,
      },
    });
  }
}
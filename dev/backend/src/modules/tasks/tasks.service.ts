import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, projectCode: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (!this.canSeeAll(user?.role)) {
      const userEmail = String(user?.email ?? "").trim();
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

  async uploadAttachment(
    taskId: string,
    file: Express.Multer.File,
    userId: string,
  ) {
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

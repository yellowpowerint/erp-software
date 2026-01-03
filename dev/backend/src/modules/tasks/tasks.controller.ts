import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerConfig } from "../documents/config/multer.config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TasksService } from "./tasks.service";
import {
  AddTaskCommentDto,
  TasksListQueryDto,
  UpdateTaskAssignmentDto,
  UpdateTaskStatusDto,
} from "./dto";

@Controller("tasks")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  listTasks(@CurrentUser() user: any, @Query() query: TasksListQueryDto) {
    return this.tasksService.listTasks(user, query);
  }

  @Get(":id")
  getTaskById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.tasksService.getTaskById(user, id);
  }

  @Patch(":id/status")
  updateTaskStatus(
    @Param("id") id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateTaskStatus(user, id, dto.status);
  }

  @Post(":id/comments")
  addTaskComment(
    @Param("id") id: string,
    @Body() dto: AddTaskCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.addTaskComment(user, id, dto.content);
  }

  @Patch(":id/assignment")
  updateTaskAssignment(
    @Param("id") id: string,
    @Body() dto: UpdateTaskAssignmentDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateTaskAssignment(user, id, dto.assignedToId);
  }

  @Post(":id/attachments")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  uploadAttachment(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.uploadAttachment(id, file, user.userId);
  }
}
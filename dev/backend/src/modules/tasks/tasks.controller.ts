import { Controller, Get, Param, Query, UseGuards, Post, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerConfig } from "../documents/config/multer.config";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TasksService } from "./tasks.service";
import { TasksListQueryDto } from "./dto";

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

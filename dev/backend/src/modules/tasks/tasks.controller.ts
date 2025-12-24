import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
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
}

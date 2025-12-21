import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ProcurementWorkflowsService } from "./procurement-workflows.service";
import {
  CreateProcurementWorkflowDto,
  UpdateProcurementWorkflowDto,
} from "./dto";

@Controller("procurement/workflows")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementWorkflowsController {
  constructor(private readonly workflowsService: ProcurementWorkflowsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateProcurementWorkflowDto) {
    return this.workflowsService.createWorkflow(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.workflowsService.getWorkflows(user);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.workflowsService.getWorkflowById(id, user);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProcurementWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.updateWorkflow(id, dto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.workflowsService.deleteWorkflow(id, user);
  }

  @Post("seed")
  seed(@CurrentUser() user: any) {
    return this.workflowsService.seedDefaultWorkflows(user);
  }
}

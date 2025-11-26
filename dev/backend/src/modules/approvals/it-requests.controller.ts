import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ITRequestsService } from "./it-requests.service";
import { CreateITRequestDto, ApprovalActionDto } from "./dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("approvals/it-requests")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ITRequestsController {
  constructor(private readonly itRequestsService: ITRequestsService) {}

  @Post()
  @Roles(
    "SUPER_ADMIN",
    "CEO",
    "CFO",
    "IT_MANAGER",
    "DEPARTMENT_HEAD",
    "OPERATIONS_MANAGER",
  )
  createITRequest(@CurrentUser() user: any, @Body() dto: CreateITRequestDto) {
    return this.itRequestsService.createITRequest(user.userId, dto);
  }

  @Get()
  getITRequests(@CurrentUser() user: any) {
    return this.itRequestsService.getITRequests(user.userId, user.role);
  }

  @Get(":id")
  getITRequestById(@Param("id") id: string) {
    return this.itRequestsService.getITRequestById(id);
  }

  @Post(":id/approve")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "IT_MANAGER")
  approveITRequest(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.itRequestsService.approveITRequest(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  @Post(":id/reject")
  @Roles("SUPER_ADMIN", "CEO", "CFO", "IT_MANAGER")
  rejectITRequest(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ApprovalActionDto,
  ) {
    return this.itRequestsService.rejectITRequest(
      id,
      user.userId,
      user.role,
      dto,
    );
  }
}

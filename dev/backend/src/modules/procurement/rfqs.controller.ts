import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { RFQsService } from "./rfqs.service";
import {
  AwardRFQDto,
  CreateRFQDto,
  EvaluateRFQDto,
  InviteRFQVendorsDto,
  SubmitRFQResponseDto,
  UpdateRFQDto,
  UpdateRFQResponseDto,
} from "./dto";

@Controller("procurement/rfqs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class RFQsController {
  constructor(private readonly rfqsService: RFQsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  create(@CurrentUser() user: any, @Body() dto: CreateRFQDto) {
    return this.rfqsService.createRFQ(dto, user);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  list(@CurrentUser() user: any, @Query() query: any) {
    return this.rfqsService.listRFQs(query, user);
  }

  @Get("invited")
  @Roles(UserRole.VENDOR)
  invited(@CurrentUser() user: any) {
    return this.rfqsService.listInvitedRFQs(user);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.rfqsService.getRFQById(id, user);
  }

  @Put(":id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  update(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateRFQDto,
  ) {
    return this.rfqsService.updateRFQ(id, dto, user);
  }

  @Post(":id/publish")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  publish(@Param("id") id: string, @CurrentUser() user: any) {
    return this.rfqsService.publishRFQ(id, user);
  }

  @Post(":id/close")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  close(@Param("id") id: string, @CurrentUser() user: any) {
    return this.rfqsService.closeRFQ(id, user);
  }

  @Post(":id/invite")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  invite(
    @Param("id") id: string,
    @Body() dto: InviteRFQVendorsDto,
    @CurrentUser() user: any,
  ) {
    return this.rfqsService.inviteVendors(id, dto, user);
  }

  @Post(":id/respond")
  @Roles(UserRole.VENDOR)
  respond(
    @Param("id") rfqId: string,
    @Body() dto: SubmitRFQResponseDto,
    @CurrentUser() user: any,
  ) {
    return this.rfqsService.submitResponse(rfqId, dto, user);
  }

  @Put(":id/response")
  @Roles(UserRole.VENDOR)
  updateResponse(
    @Param("id") rfqId: string,
    @Body() dto: UpdateRFQResponseDto,
    @CurrentUser() user: any,
  ) {
    return this.rfqsService.updateMyResponse(rfqId, dto, user);
  }

  @Post(":id/evaluate")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  evaluate(
    @Param("id") rfqId: string,
    @Body() dto: EvaluateRFQDto,
    @CurrentUser() user: any,
  ) {
    return this.rfqsService.evaluateResponses(rfqId, dto, user);
  }

  @Post(":id/award")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  award(
    @Param("id") rfqId: string,
    @Body() dto: AwardRFQDto,
    @CurrentUser() user: any,
  ) {
    return this.rfqsService.awardRFQ(rfqId, dto, user);
  }
}

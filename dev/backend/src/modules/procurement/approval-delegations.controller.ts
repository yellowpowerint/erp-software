import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ApprovalDelegationsService } from "./approval-delegations.service";
import { CreateApprovalDelegationDto } from "./dto";

@Controller("procurement/delegations")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalDelegationsController {
  constructor(private readonly delegationsService: ApprovalDelegationsService) {}

  @Post()
  create(@Body() dto: CreateApprovalDelegationDto, @CurrentUser() user: any) {
    return this.delegationsService.createDelegation(dto, user);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.delegationsService.getDelegations(user);
  }

  @Delete(":id")
  cancel(@Param("id") id: string, @CurrentUser() user: any) {
    return this.delegationsService.cancelDelegation(id, user);
  }
}

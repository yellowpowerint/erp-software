import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { FleetAssignmentsQueryDto } from "./dto";
import { FleetService } from "./fleet.service";

@Controller("fleet/assignments")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetAssignmentsController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  list(@Query() query: FleetAssignmentsQueryDto) {
    return this.fleetService.listAssignments(query);
  }

  @Get("active")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.DEPARTMENT_HEAD,
    UserRole.EMPLOYEE,
  )
  active() {
    return this.fleetService.listActiveAssignments();
  }

  @Post(":id/end")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.WAREHOUSE_MANAGER,
  )
  end(@Param("id") id: string, @CurrentUser() user: any) {
    return this.fleetService.endAssignment(id, user);
  }
}

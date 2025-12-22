import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { FleetAssetsController } from "./fleet-assets.controller";
import { FleetAssignmentsController } from "./fleet-assignments.controller";
import { FleetMaintenanceController } from "./fleet-maintenance.controller";
import { FleetMaintenanceService } from "./fleet-maintenance.service";
import { FleetMaintenanceReminderService } from "./fleet-maintenance-reminder.service";
import { FleetOperationsController } from "./fleet-operations.controller";
import { FleetOperationsService } from "./fleet-operations.service";
import { FleetService } from "./fleet.service";

@Module({
  imports: [PrismaModule, DocumentsModule, NotificationsModule],
  controllers: [
    FleetAssetsController,
    FleetAssignmentsController,
    FleetMaintenanceController,
    FleetOperationsController,
  ],
  providers: [
    FleetService,
    FleetMaintenanceService,
    FleetMaintenanceReminderService,
    FleetOperationsService,
  ],
  exports: [FleetService, FleetMaintenanceService, FleetOperationsService],
})
export class FleetModule {}

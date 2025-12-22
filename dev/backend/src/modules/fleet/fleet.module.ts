import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { FleetAssetsController } from "./fleet-assets.controller";
import { FleetAssignmentsController } from "./fleet-assignments.controller";
import { FleetMaintenanceController } from "./fleet-maintenance.controller";
import { FleetMaintenanceService } from "./fleet-maintenance.service";
import { FleetMaintenanceReminderService } from "./fleet-maintenance-reminder.service";
import { FleetService } from "./fleet.service";

@Module({
  imports: [PrismaModule, DocumentsModule, NotificationsModule],
  controllers: [
    FleetAssetsController,
    FleetAssignmentsController,
    FleetMaintenanceController,
  ],
  providers: [FleetService, FleetMaintenanceService, FleetMaintenanceReminderService],
  exports: [FleetService, FleetMaintenanceService],
})
export class FleetModule {}

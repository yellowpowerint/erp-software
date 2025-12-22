import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CsvModule } from "../csv/csv.module";
import { FleetAssetsController } from "./fleet-assets.controller";
import { FleetAssignmentsController } from "./fleet-assignments.controller";
import { FleetMaintenanceController } from "./fleet-maintenance.controller";
import { FleetMaintenanceService } from "./fleet-maintenance.service";
import { FleetMaintenanceReminderService } from "./fleet-maintenance-reminder.service";
import { FleetOperationsController } from "./fleet-operations.controller";
import { FleetOperationsService } from "./fleet-operations.service";
import { FleetFuelController } from "./fleet-fuel.controller";
import { FleetFuelService } from "./fleet-fuel.service";
import { FleetService } from "./fleet.service";
import { FleetAnalyticsController } from "./fleet-analytics.controller";
import { FleetAnalyticsService } from "./fleet-analytics.service";

@Module({
  imports: [PrismaModule, DocumentsModule, NotificationsModule, CsvModule],
  controllers: [
    FleetAssetsController,
    FleetAssignmentsController,
    FleetMaintenanceController,
    FleetOperationsController,
    FleetFuelController,
    FleetAnalyticsController,
  ],
  providers: [
    FleetService,
    FleetMaintenanceService,
    FleetMaintenanceReminderService,
    FleetOperationsService,
    FleetFuelService,
    FleetAnalyticsService,
  ],
  exports: [
    FleetService,
    FleetMaintenanceService,
    FleetOperationsService,
    FleetFuelService,
    FleetAnalyticsService,
  ],
})
export class FleetModule {}

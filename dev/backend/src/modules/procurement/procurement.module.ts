import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DocumentsModule } from "../documents/documents.module";
import { RequisitionsController } from "./requisitions.controller";
import { RequisitionsService } from "./requisitions.service";
import { ProcurementWorkflowsController } from "./procurement-workflows.controller";
import { ProcurementWorkflowsService } from "./procurement-workflows.service";
import { ApprovalDelegationsController } from "./approval-delegations.controller";
import { ApprovalDelegationsService } from "./approval-delegations.service";
import { VendorsController } from "./vendors.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [PrismaModule, NotificationsModule, DocumentsModule],
  controllers: [
    RequisitionsController,
    ProcurementWorkflowsController,
    ApprovalDelegationsController,
    VendorsController,
  ],
  providers: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
    VendorsService,
  ],
  exports: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
    VendorsService,
  ],
})
export class ProcurementModule {}

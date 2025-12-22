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
import { RFQsController } from "./rfqs.controller";
import { RFQsService } from "./rfqs.service";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Module({
  imports: [PrismaModule, NotificationsModule, DocumentsModule],
  controllers: [
    RequisitionsController,
    ProcurementWorkflowsController,
    ApprovalDelegationsController,
    VendorsController,
    RFQsController,
    PurchaseOrdersController,
  ],
  providers: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
    VendorsService,
    RFQsService,
    PurchaseOrdersService,
  ],
  exports: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
    VendorsService,
    RFQsService,
    PurchaseOrdersService,
  ],
})
export class ProcurementModule {}

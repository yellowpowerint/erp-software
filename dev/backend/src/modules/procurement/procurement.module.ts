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
import { GoodsReceiptsController } from "./goods-receipts.controller";
import { GoodsReceiptsService } from "./goods-receipts.service";
import { InvoicesController } from "./invoices.controller";
import { InvoicesService } from "./invoices.service";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { ThreeWayMatchingService } from "./three-way-matching.service";

@Module({
  imports: [PrismaModule, NotificationsModule, DocumentsModule],
  controllers: [
    RequisitionsController,
    ProcurementWorkflowsController,
    ApprovalDelegationsController,
    VendorsController,
    RFQsController,
    PurchaseOrdersController,
    GoodsReceiptsController,
    InvoicesController,
    PaymentsController,
  ],
  providers: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
    VendorsService,
    RFQsService,
    PurchaseOrdersService,
    GoodsReceiptsService,
    ThreeWayMatchingService,
    InvoicesService,
    PaymentsService,
  ],
  exports: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
    VendorsService,
    RFQsService,
    PurchaseOrdersService,
    GoodsReceiptsService,
    ThreeWayMatchingService,
    InvoicesService,
    PaymentsService,
  ],
})
export class ProcurementModule {}

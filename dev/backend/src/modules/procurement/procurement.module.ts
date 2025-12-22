import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { DocumentsModule } from "../documents/documents.module";
import { InventoryModule } from "../inventory/inventory.module";
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
import { ProcurementDashboardController } from "./procurement-dashboard.controller";
import { ProcurementDashboardService } from "./procurement-dashboard.service";
import { ProcurementReportsController } from "./procurement-reports.controller";
import { ProcurementReportsService } from "./procurement-reports.service";
import { ProcurementInventoryController } from "./procurement-inventory.controller";
import { InventoryIntegrationService } from "./inventory-integration.service";

@Module({
  imports: [PrismaModule, NotificationsModule, DocumentsModule, InventoryModule],
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
    ProcurementDashboardController,
    ProcurementReportsController,
    ProcurementInventoryController,
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
    ProcurementDashboardService,
    ProcurementReportsService,
    InventoryIntegrationService,
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
    ProcurementDashboardService,
    ProcurementReportsService,
    InventoryIntegrationService,
  ],
})
export class ProcurementModule {}

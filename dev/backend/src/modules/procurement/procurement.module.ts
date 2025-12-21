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

@Module({
  imports: [PrismaModule, NotificationsModule, DocumentsModule],
  controllers: [
    RequisitionsController,
    ProcurementWorkflowsController,
    ApprovalDelegationsController,
  ],
  providers: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
  ],
  exports: [
    RequisitionsService,
    ProcurementWorkflowsService,
    ApprovalDelegationsService,
  ],
})
export class ProcurementModule {}

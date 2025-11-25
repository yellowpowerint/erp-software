import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ITRequestsController } from './it-requests.controller';
import { ITRequestsService } from './it-requests.service';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ApprovalsController, ITRequestsController, PaymentRequestsController, WorkflowsController],
  providers: [ApprovalsService, ITRequestsService, PaymentRequestsService, WorkflowsService, PrismaService],
  exports: [ApprovalsService, ITRequestsService, PaymentRequestsService, WorkflowsService],
})
export class ApprovalsModule {}

import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ITRequestsController } from './it-requests.controller';
import { ITRequestsService } from './it-requests.service';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ApprovalsController, ITRequestsController, PaymentRequestsController],
  providers: [ApprovalsService, ITRequestsService, PaymentRequestsService, PrismaService],
  exports: [ApprovalsService, ITRequestsService, PaymentRequestsService],
})
export class ApprovalsModule {}

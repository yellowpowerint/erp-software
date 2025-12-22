import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RecordVendorPaymentDto } from "./dto";

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private canManagePayments(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.ACCOUNTANT,
        UserRole.PROCUREMENT_OFFICER,
      ] as UserRole[]
    ).includes(role);
  }

  private canProcessPayments(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.ACCOUNTANT,
      ] as UserRole[]
    ).includes(role);
  }

  private toDecimal(value: string): Prisma.Decimal {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException("Invalid number");
    }
    return new Prisma.Decimal(n);
  }

  private computeInvoicePaymentStatus(
    total: Prisma.Decimal,
    paid: Prisma.Decimal,
    dueDate: Date,
  ) {
    if (paid.greaterThanOrEqualTo(total)) {
      return "PAID";
    }

    const now = new Date();
    if (dueDate.getTime() < now.getTime()) {
      return "OVERDUE";
    }

    if (paid.greaterThan(0)) return "PARTIALLY_PAID";
    return "UNPAID";
  }

  async recordPayment(
    invoiceId: string,
    dto: RecordVendorPaymentDto,
    user: { userId: string; role: UserRole },
  ) {
    if (!this.canProcessPayments(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    return this.prisma.$transaction(async (tx) => {
      const invoice = await (tx as any).vendorInvoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          approvedForPayment: true,
          paymentStatus: true,
        },
      });

      if (!invoice) throw new NotFoundException("Invoice not found");

      if (!invoice.approvedForPayment) {
        throw new BadRequestException("Invoice is not approved for payment");
      }

      const amount = this.toDecimal(dto.amount);
      if (amount.lessThanOrEqualTo(0)) {
        throw new BadRequestException("Payment amount must be greater than 0");
      }

      const total = new Prisma.Decimal(invoice.totalAmount);
      const alreadyPaid = new Prisma.Decimal(invoice.paidAmount);
      const remaining = total.sub(alreadyPaid);

      if (amount.greaterThan(remaining)) {
        throw new BadRequestException(
          "Payment amount exceeds remaining balance",
        );
      }

      const payment = await (tx as any).vendorPayment.create({
        data: {
          invoiceId,
          amount,
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          reference: dto.reference,
          processedById: user.userId,
          notes: dto.notes,
        },
      });

      const newPaidAmount = alreadyPaid.add(amount);
      const status = this.computeInvoicePaymentStatus(
        total,
        newPaidAmount,
        new Date(invoice.dueDate),
      );

      const updatedInvoice = await (tx as any).vendorInvoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: status,
          paidAt: status === "PAID" ? new Date() : null,
        },
      });

      return { payment, invoice: updatedInvoice };
    });
  }

  async listPayments(
    query: any,
    user: { userId: string; role: UserRole; vendorId?: string },
  ) {
    const where: any = {};

    if (user.role === UserRole.VENDOR) {
      if (!user.vendorId)
        throw new ForbiddenException("Vendor account not linked");
      where.invoice = { vendorId: user.vendorId };
    } else {
      if (!this.canManagePayments(user.role))
        throw new ForbiddenException("Not allowed");
    }

    if (query.invoiceId) where.invoiceId = String(query.invoiceId);

    return (this.prisma as any).vendorPayment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            currency: true,
            vendor: {
              select: { id: true, vendorCode: true, companyName: true },
            },
          },
        },
        processedBy: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
      take: 200,
    });
  }

  async duePayments(query: any, user: { userId: string; role: UserRole }) {
    if (!this.canManagePayments(user.role))
      throw new ForbiddenException("Not allowed");

    const days = query.days ? Number(query.days) : 30;
    const windowDays = Number.isFinite(days)
      ? Math.max(1, Math.min(365, days))
      : 30;

    const now = new Date();
    const until = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    return (this.prisma as any).vendorInvoice.findMany({
      where: {
        paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
        OR: [{ dueDate: { lte: until } }, { dueDate: { lt: now } }],
      },
      orderBy: { dueDate: "asc" },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
      },
      take: 200,
    });
  }
}

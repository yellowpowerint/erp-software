import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface Variances {
  priceVariance: Prisma.Decimal;
  quantityVariance: Prisma.Decimal;
}

export interface ThreeWayMatchResult {
  invoiceId: string;
  purchaseOrderId: string | null;
  goodsReceiptIds: string[];
  variances: Variances;
  isMatched: boolean;
  status: "MATCHED" | "PARTIAL_MATCH" | "MISMATCH";
  notes?: string;
}

@Injectable()
export class ThreeWayMatchingService {
  constructor(private prisma: PrismaService) {}

  private toDecimal(value: any): Prisma.Decimal {
    if (value instanceof Prisma.Decimal) return value;
    const n = Number(value);
    if (!Number.isFinite(n)) throw new BadRequestException("Invalid number");
    return new Prisma.Decimal(n);
  }

  private abs(d: Prisma.Decimal) {
    return d.lessThan(0) ? d.mul(-1) : d;
  }

  async calculateVariances(invoiceId: string): Promise<ThreeWayMatchResult> {
    const invoice = await (this.prisma as any).vendorInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        purchaseOrder: { include: { items: true } },
      },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");
    if (!invoice.purchaseOrderId) {
      throw new BadRequestException(
        "Invoice must be linked to a purchase order for matching",
      );
    }

    const po = invoice.purchaseOrder;
    if (!po) throw new NotFoundException("Purchase order not found");

    const receipts = await (this.prisma as any).goodsReceipt.findMany({
      where: {
        purchaseOrderId: po.id,
        status: { in: ["ACCEPTED", "PARTIALLY_ACCEPTED"] },
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    const acceptedByPoItemId = new Map<string, Prisma.Decimal>();
    for (const r of receipts) {
      for (const it of r.items) {
        const prev =
          acceptedByPoItemId.get(it.poItemId) ?? new Prisma.Decimal(0);
        acceptedByPoItemId.set(
          it.poItemId,
          prev.add(this.toDecimal(it.acceptedQty)),
        );
      }
    }

    const poItemsById = new Map<string, any>(
      po.items.map((i: any) => [i.id, i]),
    );

    let priceVariance = new Prisma.Decimal(0);
    let quantityVariance = new Prisma.Decimal(0);

    const unmatched: string[] = [];

    for (const invItem of invoice.items) {
      let poItem: any | null = null;

      if (invItem.poItemId) {
        poItem = poItemsById.get(invItem.poItemId) ?? null;
      }

      if (!poItem) {
        const guess = po.items.find(
          (i: any) =>
            String(i.itemName).trim().toLowerCase() ===
            String(invItem.description).trim().toLowerCase(),
        );
        poItem = guess ?? null;
      }

      if (!poItem) {
        unmatched.push(invItem.description);
        continue;
      }

      const invQty = this.toDecimal(invItem.quantity);
      const invUnitPrice = this.toDecimal(invItem.unitPrice);
      const poUnitPrice = this.toDecimal(poItem.unitPrice);

      const acceptedQty =
        acceptedByPoItemId.get(poItem.id) ?? new Prisma.Decimal(0);

      priceVariance = priceVariance.add(
        invUnitPrice.sub(poUnitPrice).mul(invQty),
      );
      quantityVariance = quantityVariance.add(invQty.sub(acceptedQty));
    }

    const hasUnmatched = unmatched.length > 0;
    const hasQtyMismatch = !quantityVariance.equals(0);

    let status: ThreeWayMatchResult["status"] = "MATCHED";
    if (hasUnmatched || hasQtyMismatch) status = "PARTIAL_MATCH";

    return {
      invoiceId: invoice.id,
      purchaseOrderId: po.id,
      goodsReceiptIds: receipts.map((r: any) => r.id),
      variances: { priceVariance, quantityVariance },
      isMatched: status === "MATCHED",
      status,
      notes: hasUnmatched
        ? `Unmatched invoice lines: ${unmatched.join(", ")}`
        : undefined,
    };
  }

  async performThreeWayMatch(
    invoiceId: string,
    tolerancePercent: number,
  ): Promise<ThreeWayMatchResult> {
    const result = await this.calculateVariances(invoiceId);

    const invoice = await (this.prisma as any).vendorInvoice.findUnique({
      where: { id: invoiceId },
      include: { purchaseOrder: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    const poTotal = this.toDecimal(invoice.purchaseOrder?.totalAmount ?? 0);
    const denom = poTotal.equals(0) ? new Prisma.Decimal(1) : poTotal;
    const pricePct = this.abs(result.variances.priceVariance)
      .div(denom)
      .mul(100);

    const priceOk = pricePct.lessThanOrEqualTo(
      new Prisma.Decimal(tolerancePercent),
    );
    const qtyOk = this.abs(result.variances.quantityVariance).lessThanOrEqualTo(
      new Prisma.Decimal(0),
    );

    const isMatched = priceOk && qtyOk && result.status === "MATCHED";

    return {
      ...result,
      isMatched,
      status: isMatched
        ? "MATCHED"
        : result.status === "MATCHED"
          ? "MISMATCH"
          : result.status,
    };
  }
}

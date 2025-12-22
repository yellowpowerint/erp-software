import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, UserRole, VendorStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StorageService } from "../documents/services/storage.service";
import {
  CreateVendorContactDto,
  CreateVendorDocumentDto,
  CreateVendorDto,
  CreateVendorEvaluationDto,
  CreateVendorProductDto,
  UpdateVendorDto,
  UpdateVendorProductDto,
  VendorStatusActionDto,
} from "./dto";

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  private canManage(role: UserRole): boolean {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.PROCUREMENT_OFFICER,
      ] as UserRole[]
    ).includes(role);
  }

  private assertCanManage(role: UserRole) {
    if (!this.canManage(role)) {
      throw new ForbiddenException("Not allowed");
    }
  }

  private toDecimalOrNull(value?: string): Prisma.Decimal | null {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException("Invalid number");
    }
    return new Prisma.Decimal(n);
  }

  private toDecimal(value: string): Prisma.Decimal {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw new BadRequestException("Invalid number");
    }
    return new Prisma.Decimal(n);
  }

  private async generateVendorCode(tx: Prisma.TransactionClient) {
    const year = new Date().getFullYear();
    const prefix = `VND-${year}-`;

    const count = await tx.vendor.count({
      where: {
        vendorCode: {
          startsWith: prefix,
        },
      },
    });

    return `${prefix}${String(count + 1).padStart(4, "0")}`;
  }

  async createVendor(dto: CreateVendorDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    if (!dto.category?.length) {
      throw new BadRequestException("category must be a non-empty array");
    }

    const creditLimit = this.toDecimalOrNull(dto.creditLimit);

    return this.prisma.$transaction(async (tx) => {
      const vendorCode = await this.generateVendorCode(tx);

      return tx.vendor.create({
        data: {
          vendorCode,
          companyName: dto.companyName,
          tradingName: dto.tradingName,
          type: dto.type,
          category: dto.category,
          primaryContact: dto.primaryContact,
          email: dto.email,
          phone: dto.phone,
          alternatePhone: dto.alternatePhone,
          website: dto.website,
          address: dto.address,
          city: dto.city,
          region: dto.region,
          country: dto.country ?? "Ghana",
          postalCode: dto.postalCode,
          gpsCoordinates: dto.gpsCoordinates,
          taxId: dto.taxId,
          businessRegNo: dto.businessRegNo,
          vatRegistered: dto.vatRegistered ?? false,
          vatNumber: dto.vatRegistered ? dto.vatNumber : null,
          bankName: dto.bankName,
          bankBranch: dto.bankBranch,
          accountNumber: dto.accountNumber,
          accountName: dto.accountName,
          swiftCode: dto.swiftCode,
          paymentTerms: dto.paymentTerms ?? 30,
          creditLimit,
          currency: dto.currency ?? "GHS",
          isPreferred: dto.isPreferred ?? false,
          miningLicense: dto.miningLicense,
          environmentalCert: dto.environmentalCert,
          safetyCompliance: dto.safetyCompliance ?? false,
          insuranceCert: dto.insuranceCert,
          insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
          createdById: user.userId,
        },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      });
    });
  }

  async listVendors(query: any, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const where: Prisma.VendorWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.isPreferred !== undefined) {
      where.isPreferred = String(query.isPreferred) === "true";
    }

    if (query.isBlacklisted !== undefined) {
      where.isBlacklisted = String(query.isBlacklisted) === "true";
    }

    if (query.category) {
      where.category = { has: String(query.category) };
    }

    if (query.search) {
      const search = String(query.search);
      where.OR = [
        { vendorCode: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
        { tradingName: { contains: search, mode: "insensitive" } },
        { primaryContact: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        _count: { select: { contacts: true, documents: true, products: true, evaluations: true } },
      },
    });

    return vendors;
  }

  async getVendorById(id: string, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        contacts: { orderBy: { isPrimary: "desc" } },
        documents: { orderBy: { uploadedAt: "desc" }, include: { uploadedBy: { select: { id: true, firstName: true, lastName: true, role: true } } } },
        products: { orderBy: { productName: "asc" } },
        evaluations: { orderBy: { evaluatedAt: "desc" }, take: 50, include: { evaluator: { select: { id: true, firstName: true, lastName: true, role: true } } } },
      },
    });

    if (!vendor) throw new NotFoundException("Vendor not found");
    return vendor;
  }

  async updateVendor(id: string, dto: UpdateVendorDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    const existing = await this.prisma.vendor.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Vendor not found");

    const creditLimit = dto.creditLimit !== undefined ? this.toDecimalOrNull(dto.creditLimit) : undefined;

    return this.prisma.vendor.update({
      where: { id },
      data: {
        companyName: dto.companyName,
        tradingName: dto.tradingName,
        type: dto.type,
        category: dto.category,
        primaryContact: dto.primaryContact,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        website: dto.website,
        address: dto.address,
        city: dto.city,
        region: dto.region,
        country: dto.country,
        postalCode: dto.postalCode,
        gpsCoordinates: dto.gpsCoordinates,
        taxId: dto.taxId,
        businessRegNo: dto.businessRegNo,
        vatRegistered: dto.vatRegistered,
        vatNumber: dto.vatRegistered === true ? dto.vatNumber : dto.vatRegistered === false ? null : undefined,
        bankName: dto.bankName,
        bankBranch: dto.bankBranch,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        swiftCode: dto.swiftCode,
        paymentTerms: dto.paymentTerms,
        creditLimit: creditLimit as any,
        currency: dto.currency,
        isPreferred: dto.isPreferred,
        miningLicense: dto.miningLicense,
        environmentalCert: dto.environmentalCert,
        safetyCompliance: dto.safetyCompliance,
        insuranceCert: dto.insuranceCert,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : dto.insuranceExpiry === null ? null : undefined,
      },
    });
  }

  async deleteVendor(id: string, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    const existing = await this.prisma.vendor.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Vendor not found");

    await this.prisma.vendor.delete({ where: { id } });
    return { success: true };
  }

  async approveVendor(id: string, dto: VendorStatusActionDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    return this.prisma.vendor.update({
      where: { id },
      data: {
        status: VendorStatus.APPROVED,
        isBlacklisted: false,
        blacklistReason: null,
        isPreferred: dto.isPreferred === undefined ? undefined : dto.isPreferred,
      },
    });
  }

  async suspendVendor(id: string, _dto: VendorStatusActionDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    return this.prisma.vendor.update({
      where: { id },
      data: {
        status: VendorStatus.SUSPENDED,
      },
    });
  }

  async blacklistVendor(id: string, dto: VendorStatusActionDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    if (!dto.reason?.trim()) {
      throw new BadRequestException("reason is required");
    }

    return this.prisma.vendor.update({
      where: { id },
      data: {
        status: VendorStatus.BLACKLISTED,
        isBlacklisted: true,
        blacklistReason: dto.reason,
        isPreferred: dto.isPreferred === undefined ? undefined : dto.isPreferred,
      },
    });
  }

  async reactivateVendor(id: string, dto: VendorStatusActionDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    return this.prisma.vendor.update({
      where: { id },
      data: {
        status: VendorStatus.APPROVED,
        isBlacklisted: false,
        blacklistReason: null,
        isPreferred: dto.isPreferred === undefined ? undefined : dto.isPreferred,
      },
    });
  }

  async addContact(vendorId: string, dto: CreateVendorContactDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.vendorContact.count({ where: { vendorId } });

      const isPrimary = dto.isPrimary ?? existingCount === 0;

      if (isPrimary) {
        await tx.vendorContact.updateMany({ where: { vendorId }, data: { isPrimary: false } });
      }

      return tx.vendorContact.create({
        data: {
          vendorId,
          name: dto.name,
          position: dto.position,
          email: dto.email,
          phone: dto.phone,
          isPrimary,
        },
      });
    });
  }

  async uploadDocument(
    vendorId: string,
    file: Express.Multer.File,
    dto: CreateVendorDocumentDto,
    user: { userId: string; role: UserRole },
  ) {
    this.assertCanManage(user.role);

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    const uploadResult = await this.storageService.uploadFile(file, "vendors");

    return this.prisma.vendorDocument.create({
      data: {
        vendorId,
        type: dto.type,
        name: dto.name ?? file.originalname,
        fileUrl: uploadResult.url,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        uploadedById: user.userId,
      },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  async listDocuments(vendorId: string, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    return this.prisma.vendorDocument.findMany({
      where: { vendorId },
      orderBy: { uploadedAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });
  }

  async addProduct(vendorId: string, dto: CreateVendorProductDto, user: { userId: string; role: UserRole }) {
    this.assertCanManage(user.role);

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    return this.prisma.vendorProduct.create({
      data: {
        vendorId,
        productName: dto.productName,
        category: dto.category,
        description: dto.description,
        unitPrice: this.toDecimal(dto.unitPrice),
        unit: dto.unit,
        leadTimeDays: dto.leadTimeDays ?? null,
        minOrderQty: dto.minOrderQty ? this.toDecimal(dto.minOrderQty) : null,
      },
    });
  }

  async listProducts(vendorId: string, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    return this.prisma.vendorProduct.findMany({
      where: { vendorId },
      orderBy: { productName: "asc" },
    });
  }

  async updateProduct(
    vendorId: string,
    productId: string,
    dto: UpdateVendorProductDto,
    user: { userId: string; role: UserRole },
  ) {
    this.assertCanManage(user.role);

    const product = await this.prisma.vendorProduct.findUnique({
      where: { id: productId },
      select: { id: true, vendorId: true },
    });

    if (!product || product.vendorId !== vendorId) {
      throw new NotFoundException("Product not found");
    }

    return this.prisma.vendorProduct.update({
      where: { id: productId },
      data: {
        productName: dto.productName,
        category: dto.category,
        description: dto.description,
        unitPrice: dto.unitPrice ? this.toDecimal(dto.unitPrice) : undefined,
        unit: dto.unit,
        leadTimeDays: dto.leadTimeDays === undefined ? undefined : dto.leadTimeDays,
        minOrderQty: dto.minOrderQty === undefined ? undefined : dto.minOrderQty ? this.toDecimal(dto.minOrderQty) : null,
      },
    });
  }

  private computeOverallScore(dto: CreateVendorEvaluationDto) {
    const sum =
      dto.qualityScore +
      dto.deliveryScore +
      dto.priceScore +
      dto.serviceScore +
      dto.safetyScore;
    const avg = sum / 5;
    return new Prisma.Decimal(avg.toFixed(2));
  }

  async evaluateVendor(vendorId: string, dto: CreateVendorEvaluationDto, user: { userId: string; role: UserRole }) {
    if (!(
      [
        UserRole.SUPER_ADMIN,
        UserRole.CEO,
        UserRole.CFO,
        UserRole.PROCUREMENT_OFFICER,
        UserRole.OPERATIONS_MANAGER,
        UserRole.SAFETY_OFFICER,
      ] as UserRole[]
    ).includes(user.role)) {
      throw new ForbiddenException("Not allowed");
    }

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    const overallScore = this.computeOverallScore(dto);

    const evaluation = await this.prisma.vendorEvaluation.create({
      data: {
        vendorId,
        evaluatorId: user.userId,
        period: dto.period,
        qualityScore: dto.qualityScore,
        deliveryScore: dto.deliveryScore,
        priceScore: dto.priceScore,
        serviceScore: dto.serviceScore,
        safetyScore: dto.safetyScore,
        overallScore,
        comments: dto.comments,
        recommendation: dto.recommendation,
      },
      include: {
        evaluator: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    await this.recomputePerformance(vendorId);

    return evaluation;
  }

  async listEvaluations(vendorId: string, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true } });
    if (!vendor) throw new NotFoundException("Vendor not found");

    return this.prisma.vendorEvaluation.findMany({
      where: { vendorId },
      orderBy: { evaluatedAt: "desc" },
      include: {
        evaluator: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
      take: 200,
    });
  }

  private async recomputePerformance(vendorId: string) {
    const evals = await this.prisma.vendorEvaluation.findMany({
      where: { vendorId },
      select: {
        overallScore: true,
        deliveryScore: true,
        qualityScore: true,
      },
    });

    if (evals.length === 0) {
      return;
    }

    const avgOverall =
      evals.reduce((acc, e) => acc + Number(e.overallScore), 0) / evals.length;
    const avgDelivery =
      evals.reduce((acc, e) => acc + e.deliveryScore, 0) / evals.length;
    const avgQuality =
      evals.reduce((acc, e) => acc + e.qualityScore, 0) / evals.length;

    const rating = new Prisma.Decimal(avgOverall.toFixed(2));
    const onTimeDeliveryPct = new Prisma.Decimal(((avgDelivery / 5) * 100).toFixed(2));
    const qualityScorePct = new Prisma.Decimal(((avgQuality / 5) * 100).toFixed(2));

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        rating,
        onTimeDelivery: onTimeDeliveryPct,
        qualityScore: qualityScorePct,
      },
    });
  }

  async getPerformance(vendorId: string, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        vendorCode: true,
        companyName: true,
        rating: true,
        totalOrders: true,
        totalSpend: true,
        onTimeDelivery: true,
        qualityScore: true,
        status: true,
      },
    });

    if (!vendor) throw new NotFoundException("Vendor not found");

    const latest = await this.prisma.vendorEvaluation.findMany({
      where: { vendorId },
      orderBy: { evaluatedAt: "desc" },
      take: 12,
      select: {
        period: true,
        overallScore: true,
        evaluatedAt: true,
      },
    });

    return { vendor, evaluations: latest };
  }

  async preferredVendors(user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    return this.prisma.vendor.findMany({
      where: {
        isPreferred: true,
        isBlacklisted: false,
        status: VendorStatus.APPROVED,
      },
      orderBy: [{ rating: "desc" }, { companyName: "asc" }],
    });
  }

  async byCategory(category: string, user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    return this.prisma.vendor.findMany({
      where: {
        category: { has: category },
        isBlacklisted: false,
      },
      orderBy: [{ rating: "desc" }, { companyName: "asc" }],
    });
  }

  async expiringDocuments(user: { userId: string; role: UserRole }, days: number = 30) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const now = new Date();
    const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.vendorDocument.findMany({
      where: {
        expiryDate: {
          not: null,
          lte: until,
        },
      },
      orderBy: { expiryDate: "asc" },
      include: {
        vendor: { select: { id: true, vendorCode: true, companyName: true, status: true, isBlacklisted: true } },
      },
      take: 200,
    });
  }

  async stats(user: { userId: string; role: UserRole }) {
    if (!user?.role) throw new ForbiddenException("Not allowed");

    const total = await this.prisma.vendor.count();
    const byStatusRaw = await this.prisma.vendor.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRaw as any) {
      byStatus[String(row.status)] = row._count._all;
    }

    const preferred = await this.prisma.vendor.count({ where: { isPreferred: true } });
    const blacklisted = await this.prisma.vendor.count({ where: { isBlacklisted: true } });
    const expiringDocs30 = await this.expiringDocuments(user, 30);

    return {
      total,
      byStatus,
      preferred,
      blacklisted,
      expiringDocumentsNext30Days: expiringDocs30.length,
    };
  }
}

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../common/prisma/prisma.service";
import * as PDFDocument from "pdfkit";
import * as QRCode from "qrcode";
import * as fs from "fs";
import axios from "axios";

export interface PDFGenerationOptions {
  includeWatermark?: boolean;
  watermarkText?: string;
  includeQRCode?: boolean;
  qrCodeData?: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate Invoice PDF
   */
  async generateInvoicePDF(
    invoiceId: string,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        createdBy: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    return this.createPDF(async (doc) => {
      await this.addHeader(doc, "INVOICE");

      // Invoice details
      doc.fontSize(10);
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 150);
      doc.text(
        `Date: ${new Date(invoice.createdAt).toLocaleDateString()}`,
        50,
        165,
      );
      doc.text(
        `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`,
        50,
        180,
      );
      doc.text(`Status: ${invoice.status}`, 50, 195);

      // Supplier info
      doc
        .fontSize(12)
        .text("Supplier Information", 50, 230, { underline: true });
      doc.fontSize(10);
      doc.text(`Supplier: ${invoice.supplierName}`, 50, 250);
      if (invoice.supplierEmail) {
        doc.text(`Email: ${invoice.supplierEmail}`, 50, 265);
      }

      // Invoice details
      doc.fontSize(12).text("Invoice Details", 50, 300, { underline: true });
      doc.fontSize(10);
      doc.text(`Description:`, 50, 320);
      doc.fontSize(9);
      doc.text(invoice.description, 50, 335, { width: 500 });

      // Amount
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text(`Total Amount:`, 50, 400);
      doc.text(`₵${invoice.amount.toFixed(2)} ${invoice.currency}`, 50, 420);

      // Created by
      doc.fontSize(10).font("Helvetica");
      doc.text(
        `Created By: ${invoice.createdBy.firstName} ${invoice.createdBy.lastName}`,
        50,
        460,
      );
      if (invoice.createdBy.department) {
        doc.text(`Department: ${invoice.createdBy.department}`, 50, 475);
      }

      // Notes
      if (invoice.notes) {
        doc.fontSize(12).font("Helvetica");
        doc.text("Notes:", 50, 510, { underline: true });
        doc.fontSize(9);
        doc.text(invoice.notes, 50, 530, { width: 500 });
      }

      // Add QR code if requested
      if (options.includeQRCode) {
        this.addQRCode(
          doc,
          options.qrCodeData || `INVOICE-${invoice.invoiceNumber}`,
          450,
          650,
        );
      }

      // Add watermark if requested
      if (options.includeWatermark) {
        this.addWatermark(doc, options.watermarkText || invoice.status);
      }

      this.addFooter(doc);
    });
  }

  /**
   * Generate Purchase Order PDF
   */
  async generatePurchaseOrderPDF(
    poId: string,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer> {
    const po = await this.prisma.purchaseRequest.findUnique({
      where: { id: poId },
      include: {
        createdBy: true,
      },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order ${poId} not found`);
    }

    return this.createPDF(async (doc) => {
      await this.addHeader(doc, "PURCHASE REQUEST");

      // PR details
      doc.fontSize(10);
      doc.text(`Request Number: ${po.requestNumber}`, 50, 150);
      doc.text(`Date: ${new Date(po.createdAt).toLocaleDateString()}`, 50, 165);
      doc.text(`Status: ${po.status}`, 50, 180);
      doc.text(`Urgency: ${po.urgency}`, 50, 195);

      // Requester info
      doc.fontSize(12).text("Requested By", 50, 230, { underline: true });
      doc.fontSize(10);
      doc.text(
        `Name: ${po.createdBy.firstName} ${po.createdBy.lastName}`,
        50,
        250,
      );
      if (po.createdBy.department) {
        doc.text(`Department: ${po.createdBy.department}`, 50, 265);
      }

      // Request details
      doc.fontSize(12).text("Request Details", 50, 300, { underline: true });
      doc.fontSize(10);
      doc.text(`Title: ${po.title}`, 50, 320);
      doc.text(`Category: ${po.category}`, 50, 335);
      doc.text(`Quantity: ${po.quantity}`, 50, 350);
      doc.text(
        `Estimated Cost: ₵${po.estimatedCost.toFixed(2)} ${po.currency}`,
        50,
        365,
      );

      // Description
      doc.fontSize(12).text("Description", 50, 400, { underline: true });
      doc.fontSize(9);
      doc.text(po.description, 50, 420, { width: 500 });

      // Justification
      if (po.justification) {
        doc.fontSize(12).font("Helvetica");
        doc.text("Justification:", 50, 480, { underline: true });
        doc.fontSize(9);
        doc.text(po.justification, 50, 500, { width: 500 });
      }

      // Supplier suggestion
      if (po.supplierSuggestion) {
        doc.fontSize(12).font("Helvetica");
        doc.text("Supplier Suggestion:", 50, 560, { underline: true });
        doc.fontSize(9);
        doc.text(po.supplierSuggestion, 50, 580, { width: 500 });
      }

      if (options.includeQRCode) {
        this.addQRCode(
          doc,
          options.qrCodeData || `PR-${po.requestNumber}`,
          450,
          650,
        );
      }

      if (options.includeWatermark) {
        this.addWatermark(doc, options.watermarkText || po.status);
      }

      this.addFooter(doc);
    });
  }

  /**
   * Generate Project Report PDF
   */
  async generateProjectReportPDF(
    projectId: string,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer> {
    // For now, create a basic project report template
    // In production, you'd fetch actual project data from the database

    return this.createPDF(async (doc) => {
      await this.addHeader(doc, "PROJECT REPORT");

      doc.fontSize(10);
      doc.text(`Project ID: ${projectId}`, 50, 150);
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 50, 165);

      doc.fontSize(12).text("Executive Summary", 50, 200, { underline: true });
      doc.fontSize(10);
      doc.text(
        "This is a project summary report generated for review.",
        50,
        220,
        { width: 500 },
      );

      doc.fontSize(12).text("Project Status", 50, 270, { underline: true });
      doc.fontSize(10);
      doc.text("Status: In Progress", 50, 290);
      doc.text("Completion: 65%", 50, 305);

      doc.fontSize(12).text("Key Milestones", 50, 340, { underline: true });
      doc.fontSize(10);
      doc.text("• Phase 1: Completed", 60, 360);
      doc.text("• Phase 2: In Progress", 60, 375);
      doc.text("• Phase 3: Pending", 60, 390);

      if (options.includeQRCode) {
        this.addQRCode(
          doc,
          options.qrCodeData || `PROJECT-${projectId}`,
          450,
          650,
        );
      }

      if (options.includeWatermark) {
        this.addWatermark(doc, options.watermarkText || "DRAFT");
      }

      this.addFooter(doc);
    });
  }

  /**
   * Generate Expense Report PDF
   */
  async generateExpenseReportPDF(
    expenseId: string,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer> {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        submittedBy: true,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    return this.createPDF(async (doc) => {
      await this.addHeader(doc, "EXPENSE REPORT");

      doc.fontSize(10);
      doc.text(`Expense Number: ${expense.expenseNumber}`, 50, 150);
      doc.text(
        `Date: ${new Date(expense.expenseDate).toLocaleDateString()}`,
        50,
        165,
      );
      doc.text(`Status: ${expense.status}`, 50, 180);

      doc.fontSize(12).text("Submitted By", 50, 215, { underline: true });
      doc.fontSize(10);
      doc.text(
        `Name: ${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`,
        50,
        235,
      );
      if (expense.submittedBy.department) {
        doc.text(`Department: ${expense.submittedBy.department}`, 50, 250);
      }

      doc.fontSize(12).text("Expense Details", 50, 285, { underline: true });
      doc.fontSize(10);
      doc.text(`Category: ${expense.category}`, 50, 305);
      doc.text(`Description: ${expense.description}`, 50, 320, { width: 500 });

      doc.fontSize(11).font("Helvetica-Bold");
      doc.text(
        `Amount: ₵${expense.amount.toFixed(2)} ${expense.currency}`,
        50,
        360,
      );

      if (expense.notes) {
        doc.fontSize(10).font("Helvetica");
        doc.text("Notes:", 50, 395);
        doc.fontSize(9);
        doc.text(expense.notes, 50, 410, { width: 500 });
      }

      if (options.includeQRCode) {
        this.addQRCode(
          doc,
          options.qrCodeData || `EXPENSE-${expense.expenseNumber}`,
          450,
          650,
        );
      }

      if (options.includeWatermark) {
        this.addWatermark(doc, options.watermarkText || expense.status);
      }

      this.addFooter(doc);
    });
  }

  /**
   * Generate Safety Report PDF
   */
  async generateSafetyReportPDF(
    incidentId: string,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer> {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException(`Safety Incident ${incidentId} not found`);
    }

    return this.createPDF(async (doc) => {
      await this.addHeader(doc, "SAFETY INCIDENT REPORT");

      doc.fontSize(10);
      doc.text(`Incident Number: ${incident.incidentNumber}`, 50, 150);
      doc.text(
        `Date: ${new Date(incident.incidentDate).toLocaleDateString()}`,
        50,
        165,
      );
      doc.text(`Severity: ${incident.severity}`, 50, 180);
      doc.text(`Status: ${incident.status}`, 50, 195);

      doc.fontSize(12).text("Incident Details", 50, 230, { underline: true });
      doc.fontSize(10);
      doc.text(`Type: ${incident.type}`, 50, 250);
      doc.text(`Location: ${incident.location}`, 50, 265);
      doc.text(`Reported By: ${incident.reportedBy}`, 50, 280);
      doc.text(
        `Reported At: ${new Date(incident.reportedAt).toLocaleDateString()}`,
        50,
        295,
      );

      doc.fontSize(12).text("Description", 50, 330, { underline: true });
      doc.fontSize(9);
      doc.text(incident.description, 50, 350, { width: 500 });

      if (incident.injuries) {
        doc.fontSize(12).text("Injuries", 50, 420, { underline: true });
        doc.fontSize(9);
        doc.text(incident.injuries, 50, 440, { width: 500 });
      }

      if (incident.correctiveActions) {
        doc
          .fontSize(12)
          .text("Corrective Actions", 50, 500, { underline: true });
        doc.fontSize(9);
        doc.text(incident.correctiveActions, 50, 520, { width: 500 });
      }

      if (incident.rootCause) {
        doc.fontSize(12).text("Root Cause", 50, 580, { underline: true });
        doc.fontSize(9);
        doc.text(incident.rootCause, 50, 600, { width: 500 });
      }

      if (options.includeQRCode) {
        this.addQRCode(
          doc,
          options.qrCodeData || `INCIDENT-${incident.incidentNumber}`,
          450,
          650,
        );
      }

      if (options.includeWatermark) {
        this.addWatermark(doc, options.watermarkText || "CONFIDENTIAL");
      }

      this.addFooter(doc);
    });
  }

  /**
   * Generate custom PDF from template
   */
  async generateCustomPDF(
    data: any,
    options: PDFGenerationOptions = {},
  ): Promise<Buffer> {
    return this.createPDF(async (doc) => {
      await this.addHeader(doc, data.title || "DOCUMENT");

      doc.fontSize(10);
      let yPosition = 150;

      // Render custom data
      if (data.sections) {
        data.sections.forEach((section: any) => {
          doc
            .fontSize(12)
            .text(section.title, 50, yPosition, { underline: true });
          yPosition += 20;
          doc.fontSize(10);
          doc.text(section.content, 50, yPosition, { width: 500 });
          yPosition += 60;
        });
      }

      if (options.includeQRCode) {
        this.addQRCode(doc, options.qrCodeData || "CUSTOM-DOC", 450, 650);
      }

      if (options.includeWatermark) {
        this.addWatermark(doc, options.watermarkText || "DRAFT");
      }

      this.addFooter(doc);
    });
  }

  /**
   * Helper: Create PDF document
   */
  private createPDF(
    contentCallback: (doc: PDFKit.PDFDocument) => Promise<void> | void,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      try {
        await contentCallback(doc);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper: Add header to PDF
   */
  private async addHeader(doc: PDFKit.PDFDocument, title: string) {
    const companyName = this.configService.get<string>(
      "COMPANY_NAME",
      "Mining ERP System",
    );
    const logoUrl = this.configService.get<string>("COMPANY_LOGO_URL");
    const logoPath = this.configService.get<string>("COMPANY_LOGO_PATH");

    let yPosition = 50;

    // Try to add logo if available
    if (logoPath || logoUrl) {
      try {
        let logoBuffer: Buffer;

        if (logoPath) {
          // Load from local path
          logoBuffer = fs.readFileSync(logoPath);
        } else if (logoUrl) {
          // Load from URL
          const response = await axios.get(logoUrl, {
            responseType: "arraybuffer",
          });
          logoBuffer = Buffer.from(response.data);
        }

        if (logoBuffer) {
          doc.image(logoBuffer, 50, yPosition, { width: 100, height: 50 });
          yPosition += 60;
        }
      } catch (error) {
        this.logger.warn(
          "Failed to load company logo, using text fallback",
          error,
        );
        // Fallback to text if logo fails
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text(companyName, 50, yPosition);
        yPosition += 40;
      }
    } else {
      // No logo configured, use company name text
      doc.fontSize(20).font("Helvetica-Bold").text(companyName, 50, yPosition);
      yPosition += 40;
    }

    doc.fontSize(16).font("Helvetica").text(title, 50, yPosition);
    doc
      .moveTo(50, yPosition + 30)
      .lineTo(550, yPosition + 30)
      .stroke();
  }

  /**
   * Helper: Add footer to PDF
   */
  private addFooter(doc: PDFKit.PDFDocument) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i + 1} of ${pageCount}`,
          50,
          750,
          { align: "center", width: 500 },
        );
    }
  }

  /**
   * Helper: Add QR code to PDF
   */
  private async addQRCode(
    doc: PDFKit.PDFDocument,
    data: string,
    x: number,
    y: number,
  ) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, { width: 100 });
      const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
      doc.image(qrCodeBuffer, x, y, { width: 80, height: 80 });
      doc
        .fontSize(7)
        .text("Scan to verify", x, y + 85, { width: 80, align: "center" });
    } catch (error) {
      this.logger.error("Failed to generate QR code", error);
    }
  }

  /**
   * Helper: Add watermark to PDF
   */
  private addWatermark(doc: PDFKit.PDFDocument, text: string) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.save();
      doc.rotate(-45, { origin: [300, 400] });
      doc
        .fontSize(60)
        .fillColor("#CCCCCC", 0.3)
        .text(text.toUpperCase(), 100, 350, { width: 400, align: "center" });
      doc.restore();
    }
  }
}

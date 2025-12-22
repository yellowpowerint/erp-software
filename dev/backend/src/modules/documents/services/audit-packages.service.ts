import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { StorageService } from "./storage.service";
import { DocumentPermissionsService } from "./document-permissions.service";
import { createHash } from "crypto";
import * as fs from "fs/promises";
import { PDFDocument, PDFName, PDFNumber, PDFString } from "pdf-lib";
import * as PDFKit from "pdfkit";

const DocumentAuditPackageStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

type DocumentAuditPackageStatus =
  (typeof DocumentAuditPackageStatus)[keyof typeof DocumentAuditPackageStatus];

type AuditPackageSpec = {
  sections: Array<{
    title: string;
    documents: Array<{ documentId: string; label?: string }>;
  }>;
};

@Injectable()
export class AuditPackagesService {
  private readonly logger = new Logger(AuditPackagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly documentPermissionsService: DocumentPermissionsService,
  ) {}

  private computeFileHash(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }

  private async getPdfBufferForDocument(documentId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    module: string;
    tempPath?: string;
  }> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) {
      throw new NotFoundException("Document not found");
    }

    if (doc.mimeType !== "application/pdf") {
      throw new BadRequestException(
        "Only PDF documents can be included in an audit package",
      );
    }

    const tempPath = await this.storageService.getLocalPath(
      doc.fileUrl,
      doc.fileName,
    );
    if (!tempPath) {
      throw new BadRequestException("Document file not accessible");
    }

    const isTemp = /[\\/]temp[\\/]/.test(tempPath);
    const buffer = await fs.readFile(tempPath);

    return {
      buffer,
      fileName: doc.originalName,
      mimeType: doc.mimeType,
      module: doc.module,
      tempPath: isTemp ? tempPath : undefined,
    };
  }

  private async cleanupTemp(tempPath?: string) {
    if (tempPath) {
      await this.storageService.cleanupTempFile(tempPath);
    }
  }

  private normalizeSpec(spec: any): AuditPackageSpec {
    if (!spec || typeof spec !== "object") {
      throw new BadRequestException("spec is required");
    }

    const sections = Array.isArray(spec.sections) ? spec.sections : [];
    if (sections.length === 0) {
      throw new BadRequestException(
        "spec.sections must contain at least one section",
      );
    }

    const normalized: AuditPackageSpec = {
      sections: sections.map((s: any) => {
        const title = String(s?.title || "").trim();
        if (!title) {
          throw new BadRequestException("Each section must have a title");
        }

        const docs = Array.isArray(s?.documents) ? s.documents : [];
        if (docs.length === 0) {
          throw new BadRequestException(
            `Section "${title}" must contain at least one document`,
          );
        }

        return {
          title,
          documents: docs.map((d: any) => {
            const documentId = String(d?.documentId || "").trim();
            if (!documentId) {
              throw new BadRequestException(
                `Section "${title}" contains an invalid documentId`,
              );
            }
            const label =
              typeof d?.label === "string" ? d.label.trim() : undefined;
            return { documentId, label: label || undefined };
          }),
        };
      }),
    };

    return normalized;
  }

  async startJob(params: { title: string; spec: any; createdById: string }) {
    const title = String(params.title || "").trim();
    if (!title) {
      throw new BadRequestException("title is required");
    }

    const normalizedSpec = this.normalizeSpec(params.spec);

    const allDocIds = normalizedSpec.sections.flatMap((s) =>
      s.documents.map((d) => d.documentId),
    );
    const uniqueDocIds = Array.from(new Set(allDocIds));

    for (const id of uniqueDocIds) {
      await this.documentPermissionsService.assertHasPermission(
        id,
        params.createdById,
        "view",
      );
    }

    const job = await (this.prisma as any).documentAuditPackageJob.create({
      data: {
        title,
        spec: normalizedSpec,
        status: DocumentAuditPackageStatus.PENDING,
        createdById: params.createdById,
      },
    });

    return job;
  }

  async listJobs(userId: string) {
    return (this.prisma as any).documentAuditPackageJob.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async getJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).documentAuditPackageJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException("Audit package job not found");
    }

    if (job.createdById !== userId) {
      throw new ForbiddenException("You do not have access to this job");
    }

    return job;
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).documentAuditPackageJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException("Audit package job not found");
    }

    if (job.createdById !== userId) {
      throw new ForbiddenException(
        "You do not have permission to cancel this job",
      );
    }

    if (
      job.status === DocumentAuditPackageStatus.COMPLETED ||
      job.status === DocumentAuditPackageStatus.FAILED
    ) {
      throw new BadRequestException(
        "Job cannot be cancelled in its current state",
      );
    }

    await (this.prisma as any).documentAuditPackageJob.update({
      where: { id: jobId },
      data: {
        status: DocumentAuditPackageStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return { success: true };
  }

  private async renderPdfKitDoc(render: (doc: any) => void): Promise<Buffer> {
    const doc = new (PDFKit as any)({ size: "A4", margin: 54 });
    const chunks: Buffer[] = [];

    doc.on("data", (c: Buffer) => chunks.push(c));

    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    render(doc);
    doc.end();

    return done;
  }

  private async createCoverPage(
    title: string,
    preparedBy: string,
  ): Promise<Buffer> {
    return this.renderPdfKitDoc((doc) => {
      doc.font("Helvetica-Bold").fontSize(24).text(title, { align: "center" });
      doc.moveDown(2);
      doc.font("Helvetica").fontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, {
        align: "center",
      });
      doc.moveDown(1);
      doc.text(`Prepared by: ${preparedBy}`, { align: "center" });
    });
  }

  private async createSectionDivider(title: string): Promise<Buffer> {
    return this.renderPdfKitDoc((doc) => {
      doc.font("Helvetica-Bold").fontSize(22).text(title, { align: "center" });
      doc.moveDown(1);
      doc
        .font("Helvetica")
        .fontSize(12)
        .text("Section Divider", { align: "center" });
    });
  }

  private estimateTocLines(
    spec: AuditPackageSpec,
  ): Array<{ label: string; page: number }> {
    const lines: Array<{ label: string; page: number }> = [];
    for (const section of spec.sections) {
      lines.push({ label: section.title, page: 0 });
      for (const d of section.documents) {
        lines.push({ label: `  ${d.label || d.documentId}`, page: 0 });
      }
    }
    return lines;
  }

  private async createTocPage(
    title: string,
    tocLines: Array<{ label: string; page: number }>,
  ): Promise<Buffer> {
    return this.renderPdfKitDoc((doc) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text("Table of Contents", { align: "center" });
      doc.moveDown(1);
      doc.font("Helvetica").fontSize(11);

      const usableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      for (const line of tocLines) {
        const label = line.label;
        const page = line.page;
        const left = label;
        const right = page > 0 ? String(page) : "";

        const rightWidth = doc.widthOfString(right);
        doc.text(left, {
          continued: true,
          width: usableWidth - rightWidth - 10,
        });
        doc.text(right, { align: "right" });
      }

      doc.moveDown(1);
      doc
        .fontSize(9)
        .fillColor("gray")
        .text(title, { align: "center" })
        .fillColor("black");
    });
  }

  private async countPages(buffer: Buffer): Promise<number> {
    const doc = await PDFDocument.load(buffer);
    return doc.getPageCount();
  }

  private addOutlines(
    pdfDoc: PDFDocument,
    outlineItems: Array<{ title: string; pageIndex: number }>,
  ) {
    const ctx = pdfDoc.context;
    const items = outlineItems.map((i) => ({
      title: i.title,
      pageIndex: i.pageIndex,
    }));

    if (items.length === 0) {
      return;
    }

    const pages = pdfDoc.getPages();

    const outlinesDict = ctx.obj({
      Type: PDFName.of("Outlines"),
      Count: PDFNumber.of(items.length),
    });
    const outlinesRef = ctx.register(outlinesDict);

    let firstRef: any = null;
    let lastRef: any = null;
    let prevRef: any = null;

    for (const item of items) {
      const pageIndex = Math.max(0, Math.min(pages.length - 1, item.pageIndex));
      const pageRef = (pages[pageIndex] as any).ref;

      const destArray = ctx.obj([
        pageRef,
        PDFName.of("XYZ"),
        PDFNumber.of(0),
        PDFNumber.of(0),
        PDFNumber.of(0),
      ]);

      const dict: any = {
        Title: PDFString.of(item.title),
        Parent: outlinesRef,
        Dest: destArray,
      };

      if (prevRef) {
        dict.Prev = prevRef;
      }

      const itemRef = ctx.register(ctx.obj(dict));

      if (!firstRef) {
        firstRef = itemRef;
      }

      if (prevRef) {
        const prevObj = ctx.lookup(prevRef) as any;
        prevObj.set(PDFName.of("Next"), itemRef);
      }

      prevRef = itemRef;
      lastRef = itemRef;
    }

    (outlinesDict as any).set(PDFName.of("First"), firstRef);
    (outlinesDict as any).set(PDFName.of("Last"), lastRef);

    (pdfDoc.catalog as any).set(PDFName.of("Outlines"), outlinesRef);
  }

  async processJob(jobId: string) {
    const job = await (this.prisma as any).documentAuditPackageJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException("Audit package job not found");
    }

    if (job.status === DocumentAuditPackageStatus.CANCELLED) {
      return;
    }

    const spec = this.normalizeSpec(job.spec);

    const creator = await this.prisma.user.findUnique({
      where: { id: job.createdById },
      select: { firstName: true, lastName: true, email: true },
    });

    const preparedBy = creator
      ? `${creator.firstName} ${creator.lastName}`.trim() || creator.email
      : "Unknown";

    const uniqueDocIds = Array.from(
      new Set(
        spec.sections.flatMap((s) => s.documents.map((d) => d.documentId)),
      ),
    );
    for (const id of uniqueDocIds) {
      await this.documentPermissionsService.assertHasPermission(
        id,
        job.createdById,
        "view",
      );
    }

    const docPageCounts = new Map<string, number>();
    const docNames = new Map<string, string>();

    const tempPaths: string[] = [];

    try {
      for (const id of uniqueDocIds) {
        const read = await this.getPdfBufferForDocument(id);
        if (read.tempPath) tempPaths.push(read.tempPath);
        docNames.set(id, read.fileName);
        docPageCounts.set(id, await this.countPages(read.buffer));
      }

      const cover = await this.createCoverPage(job.title, preparedBy);

      const dividerBuffers: Buffer[] = [];
      for (const section of spec.sections) {
        dividerBuffers.push(await this.createSectionDivider(section.title));
      }

      let tocPages = 1;
      let tocBuffer: Buffer = Buffer.alloc(0);

      for (let attempt = 0; attempt < 3; attempt++) {
        const tocLines = this.estimateTocLines(spec);

        const coverPages = await this.countPages(cover);

        const dividerPageCounts = await Promise.all(
          dividerBuffers.map((b) => this.countPages(b)),
        );

        let currentPage = coverPages + tocPages;

        let sectionIndex = 0;
        let tocLineIndex = 0;

        for (const section of spec.sections) {
          const dividerCount = dividerPageCounts[sectionIndex] || 1;
          currentPage += dividerCount;
          tocLines[tocLineIndex].page = currentPage - dividerCount + 1;
          tocLineIndex++;

          for (const doc of section.documents) {
            tocLines[tocLineIndex].page = currentPage;
            tocLineIndex++;
            const pages = docPageCounts.get(doc.documentId) || 1;
            currentPage += pages;
          }

          sectionIndex++;
        }

        tocBuffer = Buffer.from(await this.createTocPage(job.title, tocLines));
        const actual = await this.countPages(tocBuffer);

        if (actual === tocPages) {
          break;
        }

        tocPages = actual;
      }

      const merged = await PDFDocument.create();

      const outlineItems: Array<{ title: string; pageIndex: number }> = [];

      let pageCursor = 0;

      const addBuffer = async (buffer: Buffer) => {
        const src = await PDFDocument.load(buffer);
        const copied = await merged.copyPages(src, src.getPageIndices());
        for (const p of copied) {
          merged.addPage(p);
          pageCursor++;
        }
      };

      await addBuffer(cover);
      outlineItems.push({ title: "Cover", pageIndex: 0 });

      await addBuffer(tocBuffer);
      outlineItems.push({ title: "Table of Contents", pageIndex: 1 });

      for (let i = 0; i < spec.sections.length; i++) {
        const section = spec.sections[i];
        const divider = dividerBuffers[i];

        const dividerStart = pageCursor;
        await addBuffer(divider);

        outlineItems.push({ title: section.title, pageIndex: dividerStart });

        for (const d of section.documents) {
          const docStart = pageCursor;
          const read = await this.getPdfBufferForDocument(d.documentId);
          if (read.tempPath) tempPaths.push(read.tempPath);
          await addBuffer(read.buffer);

          const label = d.label || docNames.get(d.documentId) || d.documentId;
          outlineItems.push({ title: label, pageIndex: docStart });
        }
      }

      this.addOutlines(merged, outlineItems);

      const bytes = await merged.save({ useObjectStreams: true });
      const outBuffer = Buffer.from(bytes);

      const filename = `${job.title.replace(/[^\w.-]/g, "_")}-audit-package.pdf`;
      const upload = await this.storageService.uploadBuffer(
        outBuffer,
        filename,
        "application/pdf",
        "documents",
      );

      const fileHash = this.computeFileHash(outBuffer);

      const document = await this.prisma.document.create({
        data: {
          fileName: upload.key,
          originalName: filename,
          fileSize: outBuffer.length,
          mimeType: "application/pdf",
          fileUrl: upload.url,
          fileHash,
          category: "AUDIT_DOCUMENT" as any,
          module: "documents",
          referenceId: job.id,
          description: `Audit package: ${job.title}`,
          tags: ["audit-package"],
          uploadedById: job.createdById,
        },
      });

      await this.prisma.documentMetadata.create({
        data: {
          documentId: document.id,
          pageCount: merged.getPageCount(),
        },
      });

      await (this.prisma as any).documentAuditPackageJob.update({
        where: { id: job.id },
        data: {
          status: DocumentAuditPackageStatus.COMPLETED,
          outputDocumentId: document.id,
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      return document;
    } catch (error: any) {
      const message = error?.message || "Audit package build failed";
      this.logger.error(`Audit package job ${jobId} failed: ${message}`);

      await (this.prisma as any).documentAuditPackageJob.update({
        where: { id: jobId },
        data: {
          status: DocumentAuditPackageStatus.FAILED,
          errorMessage: message,
          completedAt: new Date(),
        },
      });

      throw error;
    } finally {
      for (const p of tempPaths) {
        await this.cleanupTemp(p);
      }
    }
  }

  async claimNextJob(): Promise<{ id: string } | null> {
    const candidates = await (
      this.prisma as any
    ).documentAuditPackageJob.findMany({
      where: {
        status: DocumentAuditPackageStatus.PENDING,
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    for (const c of candidates) {
      const updated = await (
        this.prisma as any
      ).documentAuditPackageJob.updateMany({
        where: {
          id: c.id,
          status: DocumentAuditPackageStatus.PENDING,
          attempts: { lt: c.maxAttempts },
        },
        data: {
          status: DocumentAuditPackageStatus.PROCESSING,
          startedAt: new Date(),
          attempts: { increment: 1 },
          errorMessage: null,
        },
      });

      if (updated?.count === 1) {
        return { id: c.id };
      }
    }

    return null;
  }

  async recoverStuckJobs(stuckMinutes: number) {
    const threshold = new Date(Date.now() - Math.max(5, stuckMinutes) * 60_000);

    await (this.prisma as any).documentAuditPackageJob.updateMany({
      where: {
        status: DocumentAuditPackageStatus.PROCESSING,
        startedAt: { lt: threshold },
      },
      data: {
        status: DocumentAuditPackageStatus.PENDING,
        startedAt: null,
      },
    });
  }
}

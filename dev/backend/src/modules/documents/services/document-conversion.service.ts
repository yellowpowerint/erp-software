import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { StorageService, StorageProvider } from "./storage.service";
import { DocumentPermissionsService } from "./document-permissions.service";
import { createHash } from "crypto";
import * as fs from "fs/promises";
import axios from "axios";
import * as PDFDocument from "pdfkit";
import { PDFDocument as PdfLibDocument } from "pdf-lib";
import sharp from "sharp";

const DocumentConversionProvider = {
  LOCAL: "LOCAL",
  CLOUDCONVERT: "CLOUDCONVERT",
} as const;

type DocumentConversionProvider =
  (typeof DocumentConversionProvider)[keyof typeof DocumentConversionProvider];

const DocumentConversionStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

@Injectable()
export class DocumentConversionService {
  private readonly logger = new Logger(DocumentConversionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly documentPermissionsService: DocumentPermissionsService,
    private readonly configService: ConfigService,
  ) {}

  private computeFileHash(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }

  private isLocalConvertible(mimeType: string): boolean {
    return (
      mimeType === "image/jpeg" ||
      mimeType === "image/png" ||
      mimeType === "image/webp" ||
      mimeType === "text/plain" ||
      mimeType === "text/csv"
    );
  }

  private cloudConvertEnabled(): boolean {
    return !!this.configService.get<string>("CLOUDCONVERT_API_KEY");
  }

  private async chooseProvider(
    mimeType: string,
  ): Promise<DocumentConversionProvider> {
    if (this.isLocalConvertible(mimeType)) {
      return DocumentConversionProvider.LOCAL;
    }

    if (this.cloudConvertEnabled()) {
      return DocumentConversionProvider.CLOUDCONVERT;
    }

    throw new BadRequestException(
      "No conversion provider available for this file type. Configure CLOUDCONVERT_API_KEY to enable Office/HTML conversion.",
    );
  }

  async startConvertToPdf(documentId: string, userId: string) {
    await this.documentPermissionsService.assertHasPermission(
      documentId,
      userId,
      "edit",
    );

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException("Document not found");
    }

    if (document.mimeType === "application/pdf") {
      throw new BadRequestException("Document is already a PDF");
    }

    const provider = await this.chooseProvider(document.mimeType);

    const job = await (this.prisma as any).documentConversionJob.create({
      data: {
        documentId,
        provider,
        status: DocumentConversionStatus.PENDING,
        inputMimeType: document.mimeType,
        createdById: userId,
      },
    });

    return job;
  }

  async getJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).documentConversionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("Conversion job not found");
    }

    await this.documentPermissionsService.assertHasPermission(
      job.documentId,
      userId,
      "view",
    );
    return job;
  }

  async listDocumentJobs(documentId: string, userId: string) {
    await this.documentPermissionsService.assertHasPermission(
      documentId,
      userId,
      "view",
    );

    return (this.prisma as any).documentConversionJob.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async cancelJob(jobId: string, userId: string) {
    const job = await (this.prisma as any).documentConversionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("Conversion job not found");
    }

    await this.documentPermissionsService.assertHasPermission(
      job.documentId,
      userId,
      "edit",
    );

    if (
      job.status !== DocumentConversionStatus.PENDING &&
      job.status !== DocumentConversionStatus.PROCESSING
    ) {
      throw new BadRequestException(
        "Only pending or processing jobs can be cancelled",
      );
    }

    await (this.prisma as any).documentConversionJob.update({
      where: { id: jobId },
      data: {
        status: DocumentConversionStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    return { success: true };
  }

  async processJob(jobId: string): Promise<void> {
    const startTime = Date.now();

    const job = await (this.prisma as any).documentConversionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return;
    }

    if (job.status === DocumentConversionStatus.CANCELLED) {
      return;
    }

    const document = await this.prisma.document.findUnique({
      where: { id: job.documentId },
    });
    if (!document) {
      await (this.prisma as any).documentConversionJob.update({
        where: { id: jobId },
        data: {
          status: DocumentConversionStatus.FAILED,
          errorMessage: "Document not found",
          completedAt: new Date(),
          processingTime: Date.now() - startTime,
        },
      });
      return;
    }

    try {
      const { buffer, filename } = await this.convertDocumentToPdfBuffer(
        document,
        job.provider,
      );

      const upload = await this.storageService.uploadBuffer(
        buffer,
        filename,
        "application/pdf",
        document.module,
      );

      const fileHash = this.computeFileHash(buffer);

      await this.prisma.documentVersion.create({
        data: {
          documentId: document.id,
          versionNumber: document.version,
          fileName: document.fileName,
          fileUrl: document.fileUrl,
          fileSize: document.fileSize,
          uploadedById: document.uploadedById,
          changeNotes: "Previous version archived",
        },
      });

      const updatedDocument = await this.prisma.document.update({
        where: { id: document.id },
        data: {
          fileName: upload.key,
          originalName: filename,
          fileSize: buffer.length,
          mimeType: "application/pdf",
          fileUrl: upload.url,
          fileHash,
          version: document.version + 1,
          updatedAt: new Date(),
        },
      });

      await (this.prisma as any).documentConversionJob.update({
        where: { id: jobId },
        data: {
          status: DocumentConversionStatus.COMPLETED,
          outputFileUrl: upload.url,
          outputFileName: filename,
          outputFileSize: buffer.length,
          completedAt: new Date(),
          processingTime: Date.now() - startTime,
          errorMessage: null,
        },
      });

      this.logger.log(
        `Conversion completed for document ${updatedDocument.id} (job ${jobId})`,
      );
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      const latestJob = await (
        this.prisma as any
      ).documentConversionJob.findUnique({
        where: { id: jobId },
      });

      const attempts = latestJob?.attempts ?? job.attempts ?? 0;
      const maxAttempts = latestJob?.maxAttempts ?? job.maxAttempts ?? 3;
      const shouldRetry = attempts < maxAttempts;

      await (this.prisma as any).documentConversionJob.update({
        where: { id: jobId },
        data: {
          status: shouldRetry
            ? DocumentConversionStatus.PENDING
            : DocumentConversionStatus.FAILED,
          errorMessage: error?.message || "Conversion failed",
          completedAt: shouldRetry ? null : new Date(),
          processingTime,
        },
      });

      if (!shouldRetry) {
        this.logger.error(
          `Conversion failed for job ${jobId}: ${error?.message || error}`,
        );
      }

      throw error;
    }
  }

  private async convertDocumentToPdfBuffer(
    document: any,
    provider: DocumentConversionProvider,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const baseName = (document.originalName || "document").replace(
      /\.[^.]+$/,
      "",
    );
    const outputFilename = `${baseName}.pdf`;

    if (provider === DocumentConversionProvider.LOCAL) {
      const localPath = await this.storageService.getLocalPath(
        document.fileUrl,
      );
      if (!localPath) {
        throw new BadRequestException("Document file not accessible");
      }

      const isTempFile = /[\\/]temp[\\/]/.test(localPath);

      try {
        const inputBuffer = await fs.readFile(localPath);
        const buffer = await this.localConvertToPdf(
          inputBuffer,
          document.mimeType,
          document.originalName,
        );
        return { buffer, filename: outputFilename };
      } finally {
        if (isTempFile) {
          await this.storageService.cleanupTempFile(localPath);
        }
      }
    }

    if (provider === DocumentConversionProvider.CLOUDCONVERT) {
      return {
        buffer: await this.cloudConvertToPdf(document),
        filename: outputFilename,
      };
    }

    throw new BadRequestException("Unsupported conversion provider");
  }

  private async localConvertToPdf(
    inputBuffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<Buffer> {
    if (
      mimeType === "image/jpeg" ||
      mimeType === "image/png" ||
      mimeType === "image/webp"
    ) {
      return this.convertImageToPdf(inputBuffer, mimeType);
    }

    if (mimeType === "text/plain" || mimeType === "text/csv") {
      const text = inputBuffer.toString("utf8");
      return this.convertTextToPdf(text, originalName);
    }

    throw new BadRequestException(
      "This file type requires an external conversion provider",
    );
  }

  private async convertImageToPdf(
    inputBuffer: Buffer,
    mimeType: string,
  ): Promise<Buffer> {
    const pdfDoc = await PdfLibDocument.create();

    let imageBytes: Buffer = inputBuffer;

    if (mimeType === "image/webp") {
      imageBytes = await sharp(inputBuffer).png().toBuffer();
      mimeType = "image/png";
    }

    if (mimeType === "image/png") {
      const png = await pdfDoc.embedPng(imageBytes);
      const { width, height } = png.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(png, { x: 0, y: 0, width, height });
    } else {
      const jpg = await pdfDoc.embedJpg(imageBytes);
      const { width, height } = jpg.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(jpg, { x: 0, y: 0, width, height });
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }

  private convertTextToPdf(text: string, title: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on("error", reject);
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      doc.font("Courier");
      doc.fontSize(12);
      doc.text(title || "Document", { align: "left" });
      doc.moveDown();
      doc.text(text, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: "left",
      });

      doc.end();
    });
  }

  private async cloudConvertToPdf(document: any): Promise<Buffer> {
    const apiKey = this.configService.get<string>("CLOUDCONVERT_API_KEY");
    if (!apiKey) {
      throw new BadRequestException("CLOUDCONVERT_API_KEY not configured");
    }

    const fileUrl = document.fileUrl || "";
    const isS3 =
      fileUrl.includes("s3.amazonaws.com") || fileUrl.includes("amazonaws.com");

    if (!isS3) {
      throw new BadRequestException(
        "CloudConvert conversion requires S3 storage or a publicly accessible file URL",
      );
    }

    const signedUrl = await this.storageService.getSignedDownloadUrl(
      document.fileName,
      StorageProvider.S3,
      3600,
    );

    const createJobResponse = await axios.post(
      "https://api.cloudconvert.com/v2/jobs",
      {
        tasks: {
          "import-file": {
            operation: "import/url",
            url: signedUrl,
          },
          "convert-file": {
            operation: "convert",
            input: "import-file",
            output_format: "pdf",
          },
          "export-file": {
            operation: "export/url",
            input: "convert-file",
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const jobId = createJobResponse?.data?.data?.id;
    if (!jobId) {
      throw new BadRequestException("CloudConvert did not return a job id");
    }

    const waitResponse = await axios.get(
      `https://api.cloudconvert.com/v2/jobs/${jobId}/wait`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    const tasks: any[] = waitResponse?.data?.data?.tasks || [];
    const exportTask = tasks.find((t) => t.name === "export-file");
    const outputUrl = exportTask?.result?.files?.[0]?.url;

    if (!outputUrl) {
      throw new BadRequestException(
        "CloudConvert export did not return a download URL",
      );
    }

    const download = await axios.get(outputUrl, {
      responseType: "arraybuffer",
    });
    return Buffer.from(download.data);
  }
}

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { StorageService } from './storage.service';
import { DocumentPermissionsService } from './document-permissions.service';
import { SignatureService } from './signature.service';
import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

const DocumentFormDraftStatus = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
  CANCELLED: 'CANCELLED',
} as const;

type DocumentFormDraftStatus = (typeof DocumentFormDraftStatus)[keyof typeof DocumentFormDraftStatus];

type FormFieldSchema = {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
};

type SignaturePlacement = {
  page?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

@Injectable()
export class DocumentFormsService {
  private readonly logger = new Logger(DocumentFormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly documentPermissionsService: DocumentPermissionsService,
    private readonly signatureService: SignatureService,
  ) {}

  private computeFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private async readDocumentPdfBuffer(document: any): Promise<{ buffer: Buffer; tempPath?: string }> {
    const tempPath = await this.storageService.getLocalPath(document.fileUrl);
    if (!tempPath) {
      throw new BadRequestException('Document file not accessible');
    }

    const isTemp = /[\\/]temp[\\/]/.test(tempPath);
    const buffer = await fs.readFile(tempPath);

    return { buffer, tempPath: isTemp ? tempPath : undefined };
  }

  private async cleanupTemp(tempPath?: string) {
    if (tempPath) {
      await this.storageService.cleanupTempFile(tempPath);
    }
  }

  private ensurePdf(document: any) {
    if (document.mimeType !== 'application/pdf') {
      throw new BadRequestException('This feature is only available for PDF documents');
    }
  }

  private extractFieldSchema(pdfDoc: PDFDocument): FormFieldSchema[] {
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const schema: FormFieldSchema[] = fields
      .map((f) => {
        const type = (f as any).constructor?.name || 'Unknown';
        const name = f.getName();

        if (type === 'PDFDropdown' || type === 'PDFOptionList') {
          const options = (f as any).getOptions ? (f as any).getOptions() : [];
          return { name, type, options };
        }

        if (type === 'PDFRadioGroup') {
          const options = (f as any).getOptions ? (f as any).getOptions() : [];
          return { name, type, options };
        }

        return { name, type };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return schema;
  }

  async createOrGetTemplate(documentId: string, userId: string) {
    await this.documentPermissionsService.assertHasPermission(documentId, userId, 'view');

    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.ensurePdf(document);

    const existing = await (this.prisma as any).documentFormTemplate.findUnique({
      where: {
        documentId_documentVersion: {
          documentId,
          documentVersion: document.version,
        },
      },
    });

    if (existing) {
      return existing;
    }

    let tempPath: string | undefined;
    try {
      const read = await this.readDocumentPdfBuffer(document);
      tempPath = read.tempPath;

      const pdfDoc = await PDFDocument.load(read.buffer);
      const schema = this.extractFieldSchema(pdfDoc);

      const created = await (this.prisma as any).documentFormTemplate.create({
        data: {
          documentId,
          documentVersion: document.version,
          fieldSchema: schema,
          fieldCount: schema.length,
          createdById: userId,
        },
      });

      return created;
    } finally {
      await this.cleanupTemp(tempPath);
    }
  }

  async listTemplates(userId: string) {
    const templates = await (this.prisma as any).documentFormTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        document: {
          select: {
            id: true,
            originalName: true,
            version: true,
          },
        },
      },
    });

    const filtered = await Promise.all(
      templates.map(async (t: any) => {
        try {
          await this.documentPermissionsService.assertHasPermission(t.documentId, userId, 'view');
          return t;
        } catch {
          return null;
        }
      }),
    );

    return filtered.filter(Boolean);
  }

  async getTemplate(templateId: string, userId: string) {
    const template = await (this.prisma as any).documentFormTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.documentPermissionsService.assertHasPermission(template.documentId, userId, 'view');
    return template;
  }

  async deleteTemplate(templateId: string, userId: string) {
    const template = await (this.prisma as any).documentFormTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.documentPermissionsService.assertHasPermission(template.documentId, userId, 'edit');

    await (this.prisma as any).documentFormTemplate.delete({ where: { id: templateId } });
    return { success: true };
  }

  async createDraft(documentId: string, userId: string, params: { templateId?: string }) {
    await this.documentPermissionsService.assertHasPermission(documentId, userId, 'edit');

    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.ensurePdf(document);

    let templateId: string | undefined = params.templateId;

    if (templateId) {
      const template = await (this.prisma as any).documentFormTemplate.findUnique({ where: { id: templateId } });
      if (!template || template.documentId !== documentId) {
        throw new BadRequestException('Invalid template');
      }
    }

    const draft = await (this.prisma as any).documentFormDraft.create({
      data: {
        documentId,
        templateId: templateId || null,
        status: DocumentFormDraftStatus.DRAFT,
        values: {},
        createdById: userId,
      },
    });

    return draft;
  }

  async listDrafts(documentId: string, userId: string) {
    await this.documentPermissionsService.assertHasPermission(documentId, userId, 'edit');

    return (this.prisma as any).documentFormDraft.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getDraft(draftId: string, userId: string) {
    const draft = await (this.prisma as any).documentFormDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.documentPermissionsService.assertHasPermission(draft.documentId, userId, 'edit');
    return draft;
  }

  async updateDraft(
    draftId: string,
    userId: string,
    payload: {
      values?: Record<string, any>;
      signatureData?: string | null;
      signatureType?: string | null;
      signatureReason?: string | null;
      signatureMetadata?: any;
    },
  ) {
    const draft = await (this.prisma as any).documentFormDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.documentPermissionsService.assertHasPermission(draft.documentId, userId, 'edit');

    if (draft.status !== DocumentFormDraftStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT drafts can be updated');
    }

    const updated = await (this.prisma as any).documentFormDraft.update({
      where: { id: draftId },
      data: {
        values: payload.values ?? undefined,
        signatureData: payload.signatureData === undefined ? undefined : payload.signatureData,
        signatureType: payload.signatureType === undefined ? undefined : payload.signatureType,
        signatureReason: payload.signatureReason === undefined ? undefined : payload.signatureReason,
        signatureMetadata: payload.signatureMetadata ?? undefined,
      },
    });

    return updated;
  }

  async cancelDraft(draftId: string, userId: string) {
    const draft = await (this.prisma as any).documentFormDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.documentPermissionsService.assertHasPermission(draft.documentId, userId, 'edit');

    if (draft.status !== DocumentFormDraftStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT drafts can be cancelled');
    }

    await (this.prisma as any).documentFormDraft.update({
      where: { id: draftId },
      data: {
        status: DocumentFormDraftStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    return { success: true };
  }

  private async applyDraftToPdfBuffer(
    document: any,
    draft: any,
    options: { flatten: boolean; embedSignature: boolean },
  ): Promise<Buffer> {
    let tempPath: string | undefined;

    try {
      const read = await this.readDocumentPdfBuffer(document);
      tempPath = read.tempPath;

      const pdfDoc = await PDFDocument.load(read.buffer);
      const form = pdfDoc.getForm();

      const fieldsByName = new Map<string, any>();
      for (const f of form.getFields()) {
        fieldsByName.set(f.getName(), f);
      }

      const values: Record<string, any> = draft.values || {};

      for (const [key, raw] of Object.entries(values)) {
        try {
          const field = fieldsByName.get(key) || null;
          if (!field) {
            continue;
          }

          const type = (field as any).constructor?.name;

          if (type === 'PDFTextField') {
            (field as any).setText(String(raw ?? ''));
          } else if (type === 'PDFCheckBox') {
            if (raw) {
              (field as any).check();
            } else {
              (field as any).uncheck();
            }
          } else if (type === 'PDFDropdown' || type === 'PDFOptionList') {
            if (raw !== null && raw !== undefined) {
              (field as any).select(String(raw));
            }
          } else if (type === 'PDFRadioGroup') {
            if (raw !== null && raw !== undefined) {
              (field as any).select(String(raw));
            }
          }
        } catch {
          continue;
        }
      }

      if (options.embedSignature && draft.signatureData) {
        const placement: SignaturePlacement = (draft.signatureMetadata || {}).placement || {};
        const pages = pdfDoc.getPages();
        const pageIndex = Math.max(0, Math.min(pages.length - 1, (placement.page || 1) - 1));
        const page = pages[pageIndex];
        const { width: pageW } = page.getSize();

        const imgBytes = Buffer.from(String(draft.signatureData).split(',').pop() || '', 'base64');
        const png = await pdfDoc.embedPng(imgBytes);

        const w = placement.width || 150;
        const h = placement.height || 50;
        const x = placement.x ?? pageW - w - 50;
        const y = placement.y ?? 50;

        page.drawImage(png, { x, y, width: w, height: h });
      }

      if (options.flatten) {
        form.flatten();
      }

      const bytes = await pdfDoc.save({ useObjectStreams: true });
      return Buffer.from(bytes);
    } finally {
      await this.cleanupTemp(tempPath);
    }
  }

  async renderDraftPdf(draftId: string, userId: string): Promise<Buffer> {
    const draft = await (this.prisma as any).documentFormDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.documentPermissionsService.assertHasPermission(draft.documentId, userId, 'edit');

    const document = await this.prisma.document.findUnique({ where: { id: draft.documentId } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.ensurePdf(document);

    return this.applyDraftToPdfBuffer(document, draft, { flatten: false, embedSignature: true });
  }

  async finalizeDraft(
    draftId: string,
    userId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const draft = await (this.prisma as any).documentFormDraft.findUnique({ where: { id: draftId } });
    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    await this.documentPermissionsService.assertHasPermission(draft.documentId, userId, 'edit');

    if (draft.status !== DocumentFormDraftStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT drafts can be finalized');
    }

    const document = await this.prisma.document.findUnique({ where: { id: draft.documentId } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    this.ensurePdf(document);

    if (draft.signatureData) {
      await this.documentPermissionsService.assertHasPermission(draft.documentId, userId, 'sign');
    }

    const outputBuffer = await this.applyDraftToPdfBuffer(document, draft, { flatten: true, embedSignature: true });

    const baseName = (document.originalName || 'document').replace(/\.[^.]+$/, '');
    const outputFilename = `${baseName}-filled.pdf`;

    const upload = await this.storageService.uploadBuffer(
      outputBuffer,
      outputFilename,
      'application/pdf',
      document.module,
    );

    const fileHash = this.computeFileHash(outputBuffer);

    await this.prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: document.version,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        uploadedById: userId,
        changeNotes: 'Previous version archived',
      },
    });

    const updatedDocument = await this.prisma.document.update({
      where: { id: document.id },
      data: {
        fileName: upload.key,
        originalName: outputFilename,
        fileSize: outputBuffer.length,
        mimeType: 'application/pdf',
        fileUrl: upload.url,
        fileHash,
        version: document.version + 1,
        updatedAt: new Date(),
      },
    });

    let signature: any = null;
    if (draft.signatureData) {
      signature = await this.signatureService.signDocument(
        document.id,
        userId,
        {
          signatureData: draft.signatureData,
          signatureType: (draft.signatureType as any) || 'DRAWN',
          reason: draft.signatureReason || undefined,
          metadata: {
            ...(draft.signatureMetadata || {}),
            source: 'FORM_DRAFT_FINALIZE',
            draftId,
          },
        },
        ipAddress,
        userAgent,
      );
    }

    const updatedDraft = await (this.prisma as any).documentFormDraft.update({
      where: { id: draftId },
      data: {
        status: DocumentFormDraftStatus.FINALIZED,
        finalizedAt: new Date(),
        outputFileUrl: upload.url,
        outputFileName: outputFilename,
        outputFileSize: outputBuffer.length,
        outputDocumentVersion: updatedDocument.version,
      },
    });

    return { document: updatedDocument, draft: updatedDraft, signature };
  }
}

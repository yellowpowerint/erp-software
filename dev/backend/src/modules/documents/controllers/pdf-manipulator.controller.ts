import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  Res,
  StreamableFile,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import archiver = require("archiver");
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { DocumentsService } from "../documents.service";
import { StorageService } from "../services/storage.service";
import {
  PdfManipulatorService,
  PageNumberPosition,
  HighlightColor,
} from "../services/pdf-manipulator.service";
import * as fs from "fs/promises";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PdfManipulatorController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly storageService: StorageService,
    private readonly pdfManipulatorService: PdfManipulatorService,
  ) {}

  @Post("merge")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async merge(
    @Body() body: { documentIds: string[]; fileName?: string },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.documentIds || body.documentIds.length < 2) {
      throw new BadRequestException("documentIds must contain at least 2 IDs");
    }

    const buffers: Buffer[] = [];
    const tempPaths: string[] = [];

    try {
      for (const documentId of body.documentIds) {
        const doc: any = await this.documentsService.findOne(
          documentId,
          req.user.userId,
          req.user.role,
        );

        if (!doc?.mimeType?.includes("pdf")) {
          throw new BadRequestException(`Document ${documentId} is not a PDF`);
        }

        const localPath = await this.storageService.getLocalPath(doc.fileUrl);
        if (!localPath) {
          throw new BadRequestException(
            `Document file not accessible: ${documentId}`,
          );
        }

        if (/[\\/]temp[\\/]/.test(localPath)) {
          tempPaths.push(localPath);
        }

        buffers.push(await fs.readFile(localPath));
      }

      const merged = await this.pdfManipulatorService.mergePDFs(buffers);

      const fileName = (body.fileName || `merged-${Date.now()}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(merged);
    } finally {
      for (const p of tempPaths) {
        await this.storageService.cleanupTempFile(p);
      }
    }
  }

  @Post("batch-merge")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async batchMerge(
    @Body()
    body: { merges: Array<{ documentIds: string[]; fileName?: string }> },
    @Request() req: any,
    @Res() res: Response,
  ) {
    if (!body.merges || body.merges.length === 0) {
      throw new BadRequestException("merges are required");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="batch-merge-${Date.now()}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const tempPaths: string[] = [];

    try {
      for (let i = 0; i < body.merges.length; i++) {
        const mergeSpec = body.merges[i];
        if (!mergeSpec.documentIds || mergeSpec.documentIds.length < 2) {
          throw new BadRequestException(
            "Each merge must include at least 2 documentIds",
          );
        }

        const buffers: Buffer[] = [];
        for (const documentId of mergeSpec.documentIds) {
          const { buffer, tempPath } = await this.getPdfBufferFromDocument(
            documentId,
            req,
          );
          buffers.push(buffer);
          if (tempPath) {
            tempPaths.push(tempPath);
          }
        }

        const merged = await this.pdfManipulatorService.mergePDFs(buffers);
        const nameRaw = mergeSpec.fileName || `merged-${i + 1}.pdf`;
        const safeName = nameRaw.replace(/[^\w.-]/g, "_");

        archive.append(merged, { name: safeName });
      }

      await archive.finalize();
    } finally {
      for (const p of tempPaths) {
        await this.storageService.cleanupTempFile(p);
      }
    }
  }

  @Post(":id/split")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async split(
    @Param("id") documentId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const doc: any = await this.documentsService.findOne(
      documentId,
      req.user.userId,
      req.user.role,
    );

    if (!doc?.mimeType?.includes("pdf")) {
      throw new BadRequestException("Document is not a PDF");
    }

    const localPath = await this.storageService.getLocalPath(doc.fileUrl);
    if (!localPath) {
      throw new BadRequestException("Document file not accessible");
    }

    const isTempFile = /[\\/]temp[\\/]/.test(localPath);
    try {
      const buffer = await fs.readFile(localPath);
      const parts = await this.pdfManipulatorService.splitToPDFBuffers(buffer);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="split-${documentId}.zip"`,
      );

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);

      for (let i = 0; i < parts.length; i++) {
        archive.append(parts[i], { name: `page-${i + 1}.pdf` });
      }

      await archive.finalize();
      return;
    } finally {
      if (isTempFile) {
        await this.storageService.cleanupTempFile(localPath);
      }
    }
  }

  @Post(":id/extract-pages")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async extractPages(
    @Param("id") documentId: string,
    @Body() body: { pages: number[]; fileName?: string },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.pages || body.pages.length === 0) {
      throw new BadRequestException("pages are required");
    }

    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const extracted = await this.pdfManipulatorService.extractPages(
        buffer,
        body.pages,
      );
      const fileName = (body.fileName || `extracted-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(extracted);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/reorder")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async reorder(
    @Param("id") documentId: string,
    @Body() body: { order: number[]; fileName?: string },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.order || body.order.length === 0) {
      throw new BadRequestException("order is required");
    }

    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const reordered = await this.pdfManipulatorService.reorderPages(
        buffer,
        body.order,
      );
      const fileName = (body.fileName || `reordered-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(reordered);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/rotate")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async rotate(
    @Param("id") documentId: string,
    @Body()
    body: { rotationDegrees: number; pages?: number[]; fileName?: string },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!Number.isFinite(body.rotationDegrees)) {
      throw new BadRequestException("rotationDegrees is required");
    }

    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const rotated = await this.pdfManipulatorService.rotatePages(
        buffer,
        body.rotationDegrees,
        body.pages,
      );
      const fileName = (body.fileName || `rotated-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(rotated);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/add-page-numbers")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async addPageNumbers(
    @Param("id") documentId: string,
    @Body()
    body: {
      position?: PageNumberPosition;
      startAt?: number;
      fontSize?: number;
      margin?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const numbered = await this.pdfManipulatorService.addPageNumbers(buffer, {
        position: body.position,
        startAt: body.startAt,
        fontSize: body.fontSize,
        margin: body.margin,
      });

      const fileName = (body.fileName || `numbered-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(numbered);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/add-headers-footers")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async addHeadersFooters(
    @Param("id") documentId: string,
    @Body()
    body: {
      headerText?: string;
      footerText?: string;
      fontSize?: number;
      margin?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const updated = await this.pdfManipulatorService.addHeaderFooter(buffer, {
        headerText: body.headerText,
        footerText: body.footerText,
        fontSize: body.fontSize,
        margin: body.margin,
      });

      const fileName = (
        body.fileName || `headers-footers-${documentId}.pdf`
      ).replace(/[^\w.-]/g, "_");
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(updated);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/annotate-text")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async annotateText(
    @Param("id") documentId: string,
    @Body()
    body: {
      text: string;
      page: number;
      x: number;
      y: number;
      fontSize?: number;
      rotationDegrees?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const updated = await this.pdfManipulatorService.annotateText(buffer, {
        text: body.text,
        page: body.page,
        x: body.x,
        y: body.y,
        fontSize: body.fontSize,
        rotationDegrees: body.rotationDegrees,
      });

      const fileName = (body.fileName || `annotated-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(updated);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/highlight")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async highlight(
    @Param("id") documentId: string,
    @Body()
    body: {
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
      color?: HighlightColor;
      opacity?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const updated = await this.pdfManipulatorService.highlight(buffer, {
        page: body.page,
        x: body.x,
        y: body.y,
        width: body.width,
        height: body.height,
        color: body.color,
        opacity: body.opacity,
      });

      const fileName = (
        body.fileName || `highlighted-${documentId}.pdf`
      ).replace(/[^\w.-]/g, "_");
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(updated);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/compress")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async compress(
    @Param("id") documentId: string,
    @Body()
    body: {
      rasterize?: boolean;
      density?: number;
      jpegQuality?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const compressed = await this.pdfManipulatorService.compress(buffer, {
        rasterize: body.rasterize,
        density: body.density,
        jpegQuality: body.jpegQuality,
      });

      const fileName = (
        body.fileName || `compressed-${documentId}.pdf`
      ).replace(/[^\w.-]/g, "_");
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(compressed);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/combine-with")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async combineWith(
    @Param("id") documentId: string,
    @Body() body: { otherDocumentId: string; fileName?: string },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body.otherDocumentId) {
      throw new BadRequestException("otherDocumentId is required");
    }

    const result = await this.merge(
      {
        documentIds: [documentId, body.otherDocumentId],
        fileName: body.fileName,
      },
      req,
      res,
    );

    if (!result) {
      throw new NotFoundException("Failed to combine PDFs");
    }

    return result;
  }

  @Post(":id/watermark")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async watermark(
    @Param("id") documentId: string,
    @Body()
    body: {
      text: string;
      opacity?: number;
      rotationDegrees?: number;
      fontSize?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const watermarked = await this.pdfManipulatorService.watermark(buffer, {
        text: body.text,
        opacity: body.opacity,
        rotationDegrees: body.rotationDegrees,
        fontSize: body.fontSize,
      });

      const fileName = (
        body.fileName || `watermarked-${documentId}.pdf`
      ).replace(/[^\w.-]/g, "_");
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(watermarked);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/stamp")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async stamp(
    @Param("id") documentId: string,
    @Body()
    body: {
      text: string;
      page?: number;
      x?: number;
      y?: number;
      fontSize?: number;
      rotationDegrees?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const stamped = await this.pdfManipulatorService.stamp(buffer, {
        text: body.text,
        page: body.page,
        x: body.x,
        y: body.y,
        fontSize: body.fontSize,
        rotationDegrees: body.rotationDegrees,
      });

      const fileName = (body.fileName || `stamped-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(stamped);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post(":id/redact")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async redact(
    @Param("id") documentId: string,
    @Body()
    body: {
      redactions: Array<{
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
      density?: number;
      fileName?: string;
    },
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, tempPath } = await this.getPdfBufferFromDocument(
      documentId,
      req,
    );
    try {
      const redacted = await this.pdfManipulatorService.redactByRasterize(
        buffer,
        {
          redactions: body.redactions,
          density: body.density,
        },
      );

      const fileName = (body.fileName || `redacted-${documentId}.pdf`).replace(
        /[^\w.-]/g,
        "_",
      );
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });

      return new StreamableFile(redacted);
    } finally {
      if (tempPath) {
        await this.storageService.cleanupTempFile(tempPath);
      }
    }
  }

  @Post("batch-compress")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async batchCompress(
    @Body()
    body: {
      documentIds: string[];
      rasterize?: boolean;
      density?: number;
      jpegQuality?: number;
    },
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.batchTransform(
      body.documentIds,
      req,
      res,
      "compressed",
      async (buffer) =>
        this.pdfManipulatorService.compress(buffer, {
          rasterize: body.rasterize,
          density: body.density,
          jpegQuality: body.jpegQuality,
        }),
    );
  }

  @Post("batch-watermark")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async batchWatermark(
    @Body()
    body: {
      documentIds: string[];
      text: string;
      opacity?: number;
      rotationDegrees?: number;
      fontSize?: number;
    },
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.batchTransform(
      body.documentIds,
      req,
      res,
      "watermarked",
      async (buffer) =>
        this.pdfManipulatorService.watermark(buffer, {
          text: body.text,
          opacity: body.opacity,
          rotationDegrees: body.rotationDegrees,
          fontSize: body.fontSize,
        }),
    );
  }

  @Post("batch-add-page-numbers")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async batchAddPageNumbers(
    @Body()
    body: {
      documentIds: string[];
      position?: PageNumberPosition;
      startAt?: number;
      fontSize?: number;
      margin?: number;
    },
    @Request() req: any,
    @Res() res: Response,
  ) {
    await this.batchTransform(
      body.documentIds,
      req,
      res,
      "numbered",
      async (buffer) =>
        this.pdfManipulatorService.addPageNumbers(buffer, {
          position: body.position,
          startAt: body.startAt,
          fontSize: body.fontSize,
          margin: body.margin,
        }),
    );
  }

  private async getPdfBufferFromDocument(
    documentId: string,
    req: any,
  ): Promise<{ buffer: Buffer; tempPath: string | null }> {
    const doc: any = await this.documentsService.findOne(
      documentId,
      req.user.userId,
      req.user.role,
    );

    if (!doc) {
      throw new NotFoundException("Document not found");
    }

    if (!doc?.mimeType?.includes("pdf")) {
      throw new BadRequestException("Document is not a PDF");
    }

    const localPath = await this.storageService.getLocalPath(doc.fileUrl);
    if (!localPath) {
      throw new BadRequestException("Document file not accessible");
    }

    const buffer = await fs.readFile(localPath);
    const isTemp = /[\\/]temp[\\/]/.test(localPath);

    return { buffer, tempPath: isTemp ? localPath : null };
  }

  private async batchTransform(
    documentIds: string[],
    req: any,
    res: Response,
    prefix: string,
    transform: (buffer: Buffer, documentId: string) => Promise<Buffer>,
  ) {
    if (!documentIds || documentIds.length === 0) {
      throw new BadRequestException("documentIds are required");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${prefix}-${Date.now()}.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const tempPaths: string[] = [];

    try {
      for (const id of documentIds) {
        const { buffer, tempPath } = await this.getPdfBufferFromDocument(
          id,
          req,
        );
        if (tempPath) {
          tempPaths.push(tempPath);
        }

        const out = await transform(buffer, id);
        archive.append(out, { name: `${prefix}-${id}.pdf` });
      }

      await archive.finalize();
    } finally {
      for (const p of tempPaths) {
        await this.storageService.cleanupTempFile(p);
      }
    }
  }
}

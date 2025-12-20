import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Request,
  StreamableFile,
  Res,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DocumentsService, CreateDocumentDto, UpdateDocumentDto } from './documents.service';
import { DocumentCategory, UserRole, OCRProvider } from '@prisma/client';
import { StorageProvider, StorageService } from './services/storage.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { multerConfig } from './config/multer.config';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import archiver = require('archiver');
import axios from 'axios';
import { createHash } from 'crypto';
import { SignatureService } from './services/signature.service';
import { SecurityService } from './services/security.service';
import { OCRService } from './services/ocr.service';
import { DataExtractionService } from './services/data-extraction.service';
import { OCRQueueService } from './services/ocr-queue.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly storageService: StorageService,
    private readonly signatureService: SignatureService,
    private readonly securityService: SecurityService,
    private readonly ocrService: OCRService,
    private readonly dataExtractionService: DataExtractionService,
    private readonly ocrQueueService: OCRQueueService,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':id/extract-text')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async extractTextAlias(
    @Param('id') documentId: string,
    @Body() body: {
      language?: string;
      provider?: OCRProvider;
      autoRotate?: boolean;
      enhanceImage?: boolean;
    },
    @Request() req: any,
  ) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const filePath = await this.storageService.getLocalPath(document.fileUrl);
    if (!filePath) {
      throw new BadRequestException('Document file not accessible');
    }

    const isTempFile = /[\\/]temp[\\/]/.test(filePath);
    try {
      const result = await this.ocrService.extractText(documentId, filePath, req.user.userId, {
        language: body.language,
        provider: body.provider,
        autoRotate: body.autoRotate,
        enhanceImage: body.enhanceImage,
      }, isTempFile);

      return { success: true, data: result };
    } finally {
      if (isTempFile) {
        await this.storageService.cleanupTempFile(filePath);
      }
    }
  }

  @Get(':id/extracted-text')
  async getExtractedTextAlias(@Param('id') documentId: string) {
    const text = await this.ocrService.getExtractedText(documentId);
    if (!text) {
      throw new NotFoundException('No extracted text found for this document');
    }
    return { success: true, data: { text } };
  }

  @Post(':id/parse-invoice')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  async parseInvoiceAlias(@Param('id') documentId: string, @Request() req: any) {
    const extractedText = await this.getOrExtractText(documentId, req.user.userId);
    if (!extractedText) {
      throw new BadRequestException('Failed to extract text from document');
    }

    const ocrJobs = await this.ocrService.getDocumentOCRJobs(documentId);
    if (ocrJobs.length === 0) {
      throw new BadRequestException('No OCR job found for document');
    }

    const latestJob = ocrJobs[0];
    const invoiceData = await this.dataExtractionService.parseInvoice(latestJob.id, documentId, extractedText);

    return { success: true, data: invoiceData };
  }

  @Post(':id/parse-receipt')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  async parseReceiptAlias(@Param('id') documentId: string, @Request() req: any) {
    const extractedText = await this.getOrExtractText(documentId, req.user.userId);
    if (!extractedText) {
      throw new BadRequestException('Failed to extract text from document');
    }

    const ocrJobs = await this.ocrService.getDocumentOCRJobs(documentId);
    if (ocrJobs.length === 0) {
      throw new BadRequestException('No OCR job found for document');
    }

    const latestJob = ocrJobs[0];
    const receiptData = await this.dataExtractionService.parseReceipt(latestJob.id, documentId, extractedText);

    return { success: true, data: receiptData };
  }

  @Post('batch-ocr')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.IT_MANAGER,
  )
  async batchOCRAlias(
    @Body() body: { documentIds: string[]; language?: string; provider?: OCRProvider },
    @Request() req: any,
  ) {
    if (!body.documentIds || body.documentIds.length === 0) {
      throw new BadRequestException('No document IDs provided');
    }

    const jobs = await this.ocrService.batchExtractText(body.documentIds, req.user.userId, {
      language: body.language,
      provider: body.provider,
    });

    for (const job of jobs) {
      await this.ocrQueueService.enqueueJob(job.jobId, job.documentId, req.user.userId, {
        language: body.language,
        provider: body.provider,
      });
    }

    return {
      success: true,
      data: {
        jobsCreated: jobs.length,
        jobs,
      },
    };
  }

  private async getOrExtractText(documentId: string, userId: string): Promise<string | null> {
    let text = await this.ocrService.getExtractedText(documentId);
    if (!text) {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      const filePath = await this.storageService.getLocalPath(document.fileUrl);
      if (!filePath) {
        throw new BadRequestException('Document file not accessible');
      }

      const result = await this.ocrService.extractText(documentId, filePath, userId);
      text = result.text;
    }

    return text;
  }

  private parseTags(raw: unknown): string[] | undefined {
    if (raw === undefined || raw === null || raw === '') {
      return undefined;
    }

    if (Array.isArray(raw)) {
      return raw.map(String).filter((t) => t.trim().length > 0);
    }

    if (typeof raw === 'string') {
      const value = raw.trim();
      if (value.length === 0) {
        return undefined;
      }

      // Try JSON array first
      if (value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) {
            throw new Error('tags must be a JSON array');
          }
          return parsed.map(String).filter((t) => t.trim().length > 0);
        } catch {
          throw new BadRequestException('Invalid tags format. Expected JSON array or comma-separated string.');
        }
      }

      // Fallback: comma-separated
      return value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }

    throw new BadRequestException('Invalid tags format. Expected JSON array or comma-separated string.');
  }

  @Post('upload')
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
  )
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    const createDto: CreateDocumentDto = {
      ...body,
      tags: this.parseTags(body.tags),
    };
    return this.documentsService.uploadDocument(file, createDto, req.user.userId);
  }

  @Post('upload-multiple')
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
  )
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig))
  async uploadMultipleDocuments(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Request() req,
  ) {
    const createDto: CreateDocumentDto = {
      ...body,
      tags: this.parseTags(body.tags),
    };
    return this.documentsService.uploadMultipleDocuments(files, createDto, req.user.userId);
  }

  @Get()
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
  async findAll(
    @Query('category') category?: DocumentCategory,
    @Query('module') module?: string,
    @Query('referenceId') referenceId?: string,
    @Query('tags') tags?: string,
    @Query('uploadedById') uploadedById?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Request() req?,
  ) {
    const filters = {
      category,
      module,
      referenceId,
      tags: tags ? tags.split(',') : undefined,
      uploadedById,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    };

    return this.documentsService.findAll(filters, req.user.userId, req.user.role);
  }

  @Get('search')
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
  async searchDocuments(
    @Query('query') query: string,
    @Request() req,
  ) {
    return this.documentsService.searchDocuments(query, req.user.userId, req.user.role);
  }

  @Get('my-uploads')
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
  async getMyUploads(@Request() req) {
    return this.documentsService.getMyUploads(req.user.userId);
  }

  @Get('recent')
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
  async getRecentDocuments(
    @Query('limit') limit?: string,
    @Request() req?,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.documentsService.getRecentDocuments(req.user.userId, req.user.role, limitNum);
  }

  @Get('statistics')
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
  )
  async getStatistics(@Request() req) {
    return this.documentsService.getStatistics(req.user.userId, req.user.role);
  }

  @Get('stats')
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
  )
  async getStats(@Request() req) {
    return this.documentsService.getStatistics(req.user.userId, req.user.role);
  }

  @Get('by-module/:module/:referenceId')
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
  async getDocumentsByModule(
    @Param('module') module: string,
    @Param('referenceId') referenceId: string,
    @Request() req,
  ) {
    return this.documentsService.getDocumentsByModule(module, referenceId, req.user.userId, req.user.role);
  }

  @Get('files/:folder/:filename')
  async serveFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Prevent path traversal attacks
    if (folder.includes('..') || folder.includes(path.sep) || 
        filename.includes('..') || filename.includes(path.sep)) {
      throw new BadRequestException('Invalid file path');
    }

    const key = `${folder}/${filename}`;
    const filePath = this.storageService.getLocalFilePath(key);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    // Determine content type from file extension
    const mimeType = mime.lookup(filename) || 'application/octet-stream';
    
    // Sanitize filename for Content-Disposition
    const safeFilename = path.basename(filename).replace(/[^\w.-]/g, '_');

    const file = fs.createReadStream(filePath);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
    });

    return new StreamableFile(file);
  }

  @Get(':id')
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
  async findOne(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.documentsService.findOne(id, req.user.userId, req.user.role);
  }

  @Get(':id/download')
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
  async downloadDocument(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.documentsService.getDownloadUrl(id, req.user.userId, req.user.role);
  }

  @Put(':id')
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
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentDto,
    @Request() req,
  ) {
    return this.documentsService.update(id, updateDto, req.user.userId, req.user.role);
  }

  @Delete(':id')
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
  )
  async delete(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.documentsService.delete(id, req.user.userId, req.user.role);
  }

  @Get('storage-usage')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.IT_MANAGER,
  )
  async getStorageUsage(@Request() req) {
    return this.documentsService.getStorageUsage(req.user.userId, req.user.role);
  }

  @Post('batch-delete')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
  )
  async batchDelete(
    @Body() body: { documentIds: string[] },
    @Request() req,
  ) {
    return this.documentsService.batchDelete(body.documentIds, req.user.userId, req.user.role);
  }

  @Post('batch-download')
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
  async batchDownload(
    @Body() body: { documentIds: string[] },
    @Request() req,
    @Res() res: Response,
  ) {
    const documents = await this.documentsService.getDocumentsForDownload(
      body.documentIds,
      req.user.userId,
      req.user.role,
    );

    if (documents.length === 0) {
      throw new NotFoundException('No documents found for download');
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="documents-${Date.now()}.zip"`);

    archive.pipe(res);

    for (const doc of documents) {
      try {
        const provider = doc.fileUrl.includes('s3.amazonaws.com')
          ? StorageProvider.S3
          : StorageProvider.LOCAL;
        
        if (provider === StorageProvider.LOCAL) {
          const filePath = this.storageService.getLocalFilePath(doc.fileName);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: doc.originalName });
          }
        } else if (provider === StorageProvider.S3) {
          // Get signed URL and stream from S3
          const signedUrl = await this.storageService.getSignedDownloadUrl(doc.fileName, provider, 300);
          const response = await axios.get(signedUrl, { responseType: 'stream' });
          archive.append(response.data, { name: doc.originalName });
          this.logger.log(`Added S3 file to archive: ${doc.id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to add file to archive: ${doc.id}`, error);
      }
    }

    await archive.finalize();
  }

  @Patch('batch-tag')
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
  )
  async batchAddTags(
    @Body() body: { documentIds: string[]; tags: string[] },
    @Request() req,
  ) {
    return this.documentsService.batchAddTags(body.documentIds, body.tags, req.user.userId, req.user.role);
  }

  // ===== Version Management Endpoints (Phase 15.3) =====

  @Get(':id/versions')
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
  async getVersionHistory(@Param('id') id: string, @Request() req) {
    return this.documentsService.getVersionHistory(id, req.user.userId, req.user.role);
  }

  @Get(':id/versions/:versionNumber')
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
  async getSpecificVersion(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @Request() req,
  ) {
    return this.documentsService.getSpecificVersion(id, parseInt(versionNumber), req.user.userId, req.user.role);
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file', multerConfig))
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
  )
  async uploadNewVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('changeNotes') changeNotes: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.documentsService.uploadNewVersion(id, file, changeNotes, req.user.userId, req.user.role);
  }

  @Post(':id/restore/:versionNumber')
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
  )
  async restoreVersion(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @Request() req,
  ) {
    return this.documentsService.restoreVersion(id, parseInt(versionNumber), req.user.userId, req.user.role);
  }

  @Get(':id/compare')
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
  async compareVersions(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req,
  ) {
    return this.documentsService.compareVersions(
      id,
      parseInt(from),
      parseInt(to),
      req.user.userId,
      req.user.role,
    );
  }

  // ===== PDF Generation Endpoints (Phase 15.3) =====

  @Post('generate/invoice/:invoiceId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
  )
  async generateInvoicePDF(
    @Param('invoiceId') invoiceId: string,
    @Body() options: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfGeneratorService.generateInvoicePDF(invoiceId, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('generate/purchase-order/:poId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.PROCUREMENT_OFFICER,
  )
  async generatePurchaseOrderPDF(
    @Param('poId') poId: string,
    @Body() options: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfGeneratorService.generatePurchaseOrderPDF(poId, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="purchase-order-${poId}.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('generate/expense-report/:expenseId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
  )
  async generateExpenseReportPDF(
    @Param('expenseId') expenseId: string,
    @Body() options: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfGeneratorService.generateExpenseReportPDF(expenseId, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="expense-report-${expenseId}.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('generate/project-report/:projectId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DEPARTMENT_HEAD,
  )
  async generateProjectReportPDF(
    @Param('projectId') projectId: string,
    @Body() options: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfGeneratorService.generateProjectReportPDF(projectId, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="project-report-${projectId}.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('generate/safety-report/:incidentId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.SAFETY_OFFICER,
    UserRole.OPERATIONS_MANAGER,
  )
  async generateSafetyReportPDF(
    @Param('incidentId') incidentId: string,
    @Body() options: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfGeneratorService.generateSafetyReportPDF(incidentId, options);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="safety-report-${incidentId}.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('generate/custom')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
  )
  async generateCustomPDF(
    @Body() body: { data: any; options?: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean } },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfGeneratorService.generateCustomPDF(body.data, body.options || {});
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="custom-document.pdf"`);
    res.send(pdfBuffer);
  }

  @Post('generate/save')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
  )
  async saveGeneratedPDF(
    @Body() body: {
      documentType: string;
      entityId: string;
      module: string;
      referenceId?: string;
      category: DocumentCategory;
      description?: string;
      tags?: string[];
      data?: any;
      options?: { includeWatermark?: boolean; watermarkText?: string; includeQRCode?: boolean };
    },
    @Request() req,
  ) {
    let pdfBuffer: Buffer;

    switch (body.documentType) {
      case 'invoice':
        pdfBuffer = await this.pdfGeneratorService.generateInvoicePDF(body.entityId, body.options || {});
        break;
      case 'purchase-order':
        pdfBuffer = await this.pdfGeneratorService.generatePurchaseOrderPDF(body.entityId, body.options || {});
        break;
      case 'expense-report':
        pdfBuffer = await this.pdfGeneratorService.generateExpenseReportPDF(body.entityId, body.options || {});
        break;
      case 'project-report':
        pdfBuffer = await this.pdfGeneratorService.generateProjectReportPDF(body.entityId, body.options || {});
        break;
      case 'safety-report':
        pdfBuffer = await this.pdfGeneratorService.generateSafetyReportPDF(body.entityId, body.options || {});
        break;
      case 'custom':
        pdfBuffer = await this.pdfGeneratorService.generateCustomPDF(body.data || {}, body.options || {});
        break;
      default:
        throw new BadRequestException('Invalid document type');
    }

    const fileName = `${body.documentType}-${body.entityId}-${Date.now()}.pdf`;
    const file = {
      buffer: pdfBuffer,
      originalname: fileName,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
    } as Express.Multer.File;

    const fileHash = createHash('sha256').update(pdfBuffer).digest('hex');

    const uploadResult = await this.storageService.uploadFile(file, body.module);

    const document = await this.prisma.document.create({
      data: {
        fileName: uploadResult.key,
        originalName: fileName,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: uploadResult.url,
        fileHash,
        category: body.category,
        module: body.module,
        referenceId: body.referenceId || body.entityId,
        description: body.description || `Generated ${body.documentType} PDF`,
        tags: body.tags || [body.documentType, 'generated', 'pdf'],
        uploadedById: req.user.userId,
        metadata: {
          create: {
            keywords: [],
          },
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        metadata: true,
      },
    });

    return document;
  }

  // ===== Phase 15.4: Digital Signatures & Document Security =====

  @Post(':id/sign')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SAFETY_OFFICER,
  )
  async signDocument(
    @Param('id') id: string,
    @Body() body: { 
      signatureData: string; 
      signatureType?: 'DRAWN' | 'TYPED' | 'UPLOADED' | 'CERTIFICATE';
      location?: string;
      reason?: string; 
      metadata?: any;
    },
    @Request() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const signature = await this.signatureService.signDocument(
      id,
      req.user.userId,
      body,
      ipAddress,
      userAgent,
    );

    return signature;
  }

  @Get(':id/signatures')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
  )
  async getDocumentSignatures(@Param('id') id: string) {
    return this.signatureService.getDocumentSignatures(id);
  }

  @Post(':id/verify-signature')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
  )
  async verifySignature(
    @Param('id') id: string,
    @Body() body: { signatureId: string },
  ) {
    return this.signatureService.verifySignature(body.signatureId, id);
  }

  @Delete('signatures/:signatureId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
  )
  async revokeSignature(
    @Param('signatureId') signatureId: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.signatureService.revokeSignature(
      signatureId,
      req.user.userId,
      body.reason,
      req.user.role,
    );
  }

  @Get(':id/signature-requirement')
  async checkSignatureRequirement(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.signatureService.checkSignatureRequirement(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(':id/security')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
  )
  async setDocumentSecurity(
    @Param('id') id: string,
    @Body() body: {
      isPasswordProtected?: boolean;
      password?: string;
      hasWatermark?: boolean;
      watermarkText?: string;
      isEncrypted?: boolean;
      expiresAt?: string;
      maxDownloads?: number;
      requireSignature?: boolean;
      allowPrint?: boolean;
      allowCopy?: boolean;
    },
    @Request() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const securityData = {
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    };

    const security = await this.securityService.setDocumentSecurity(
      id,
      req.user.userId,
      securityData,
    );

    await this.securityService.logDocumentAccess(
      id,
      req.user.userId,
      { action: 'SECURITY_UPDATED', metadata: securityData },
      ipAddress,
      userAgent,
    );

    return security;
  }

  @Get(':id/security')
  async getDocumentSecurity(@Param('id') id: string) {
    return this.securityService.getDocumentSecurity(id);
  }

  @Delete(':id/security')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
  )
  async removeDocumentSecurity(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.securityService.removeDocumentSecurity(
      id,
      req.user.userId,
      req.user.role,
    );
  }

  @Post(':id/verify-password')
  async verifyDocumentPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    const isValid = await this.securityService.verifyDocumentPassword(id, body.password);
    return { isValid };
  }

  @Get(':id/check-access')
  async checkDocumentAccess(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.securityService.checkDocumentAccess(id, req.user.userId);
  }

  @Patch(':id/extracted-text')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  async updateExtractedText(
    @Param('id') id: string,
    @Body() body: { extractedText: string },
    @Request() req,
  ) {
    const metadata = await this.prisma.documentMetadata.findUnique({
      where: { documentId: id },
    });

    if (metadata) {
      await this.prisma.documentMetadata.update({
        where: { documentId: id },
        data: { extractedText: body.extractedText },
      });
    } else {
      await this.prisma.documentMetadata.create({
        data: {
          documentId: id,
          extractedText: body.extractedText,
        },
      });
    }

    return {
      success: true,
      message: 'Extracted text updated successfully',
    };
  }

  @Get(':id/access-log')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
  )
  async getDocumentAccessLog(
    @Param('id') id: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      action,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.securityService.getDocumentAccessLogs(id, filters);
  }

  @Get('access-log/my-activity')
  async getMyAccessLogs(
    @Request() req,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.securityService.getUserAccessLogs(req.user.userId, filters);
  }

  @Post(':id/log-access')
  async logDocumentAccess(
    @Param('id') id: string,
    @Body() body: { action: string; metadata?: any },
    @Request() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.securityService.logDocumentAccess(
      id,
      req.user.userId,
      body as any,
      ipAddress,
      userAgent,
    );
  }
}

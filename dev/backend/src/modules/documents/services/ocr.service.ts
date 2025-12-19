import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { createWorker, Worker } from 'tesseract.js';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';
import { OCRProvider, OCRStatus, ExtractedDataType } from '@prisma/client';
import * as pdfParse from 'pdf-parse';
import * as PDFDocument from 'pdfkit';

export interface OCROptions {
  language?: string;
  provider?: OCRProvider;
  autoRotate?: boolean;
  enhanceImage?: boolean;
  priority?: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  pageCount?: number;
  processingTime: number;
}

@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);
  private tesseractWorker: Worker | null = null;
  private isInitialized = false;
  private webhookService: any = null;
  private tesseractLanguage = 'eng';

  constructor(private readonly prisma: PrismaService) {}

  setWebhookService(webhookService: any) {
    this.webhookService = webhookService;
  }

  /**
   * Initialize Tesseract worker
   */
  private async initializeTesseract(): Promise<void> {
    if (this.isInitialized && this.tesseractWorker) {
      return;
    }

    try {
      this.logger.log('Initializing Tesseract.js worker...');
      this.tesseractWorker = await createWorker('eng');
      this.isInitialized = true;
      this.tesseractLanguage = 'eng';
      this.logger.log('Tesseract.js worker initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Tesseract worker', error);
      throw new Error('OCR service initialization failed');
    }
  }

  async getOCREnvironmentCapabilities() {
    const result: {
      pdfRenderingSupported: boolean;
      pdfRenderingError?: string;
    } = {
      pdfRenderingSupported: false,
    };

    try {
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.text('OCR capability check');
        doc.end();
      });

      await sharp(pdfBuffer, { density: 150, page: 0 }).png().toBuffer();
      result.pdfRenderingSupported = true;
      return result;
    } catch (error) {
      result.pdfRenderingSupported = false;
      result.pdfRenderingError = error?.message || String(error);
      return result;
    }
  }

  /**
   * Extract text from document
   */
  async extractText(
    documentId: string,
    filePath: string,
    userId: string,
    options: OCROptions = {},
    _isTempFile: boolean = false,
  ): Promise<OCRResult> {
    // Create OCR job and then process it
    const ocrJob = await this.prisma.oCRJob.create({
      data: {
        documentId,
        provider: options.provider || OCRProvider.TESSERACT_JS,
        status: OCRStatus.PENDING,
        language: options.language || 'eng',
        autoRotate: options.autoRotate ?? true,
        enhanceImage: options.enhanceImage ?? true,
        priority: options.priority || 5,
        createdById: userId,
      },
    });

    return this.processOCRJob(ocrJob.id, filePath, userId, options);
  }

  /**
   * Process an existing OCRJob (used by queue workers)
   */
  async processOCRJob(
    jobId: string,
    filePath: string,
    userId: string,
    options: OCROptions = {},
  ): Promise<OCRResult> {
    const startTime = Date.now();

    const job = await this.prisma.oCRJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new BadRequestException('OCR job not found');
    }

    if (job.status === OCRStatus.CANCELLED) {
      throw new BadRequestException('OCR job has been cancelled');
    }

    try {
      await this.prisma.oCRJob.update({
        where: { id: jobId },
        data: {
          status: OCRStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      await this.logOCRProcess(jobId, 'INFO', 'OCR processing started');

      let result: OCRResult;
      if (filePath.toLowerCase().endsWith('.pdf')) {
        result = await this.extractFromPDF(filePath, options);
      } else {
        switch (options.provider || job.provider || OCRProvider.TESSERACT_JS) {
          case OCRProvider.TESSERACT_JS:
            result = await this.performTesseractOCR(filePath, options);
            break;
          case OCRProvider.GOOGLE_VISION:
            throw new BadRequestException('Google Vision API not yet implemented');
          case OCRProvider.AWS_TEXTRACT:
            throw new BadRequestException('AWS Textract not yet implemented');
          default:
            result = await this.performTesseractOCR(filePath, options);
        }
      }

      const processingTime = Date.now() - startTime;

      await this.prisma.oCRJob.update({
        where: { id: jobId },
        data: {
          status: OCRStatus.COMPLETED,
          completedAt: new Date(),
          extractedText: result.text,
          confidence: result.confidence,
          pageCount: result.pageCount,
          processingTime,
        },
      });

      await this.updateDocumentMetadata(job.documentId, result.text);

      await this.logOCRProcess(
        jobId,
        'INFO',
        `OCR completed successfully. Confidence: ${result.confidence}%`,
      );

      if (this.webhookService?.notifyOCRComplete) {
        await this.webhookService.notifyOCRComplete(
          jobId,
          job.documentId,
          OCRStatus.COMPLETED,
          result.confidence,
          result.text,
        );
      }

      return { ...result, processingTime };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await this.prisma.oCRJob.update({
        where: { id: jobId },
        data: {
          status: OCRStatus.FAILED,
          completedAt: new Date(),
          errorMessage: error.message,
          processingTime,
        },
      });

      await this.logOCRProcess(jobId, 'ERROR', `OCR failed: ${error.message}`);

      if (this.webhookService?.notifyOCRComplete) {
        await this.webhookService.notifyOCRComplete(
          jobId,
          job.documentId,
          OCRStatus.FAILED,
          undefined,
          undefined,
          error.message,
        );
      }

      throw error;
    }
  }

  /**
   * Extract text from PDF (handles both text PDFs and scanned PDFs)
   */
  private async extractFromPDF(filePath: string, options: OCROptions): Promise<OCRResult> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);

      if (pdfData.text && pdfData.text.trim().length > 100) {
        return {
          text: pdfData.text.trim(),
          confidence: 100,
          pageCount: pdfData.numpages,
          processingTime: 0,
        };
      }

      return await this.performPdfPageOCR(filePath, pdfData.numpages || 1, options);
    } catch (error) {
      this.logger.error('PDF extraction failed, trying OCR', error);
      return await this.performPdfPageOCR(filePath, 1, options);
    }
  }

  private async performPdfPageOCR(filePath: string, pageCount: number, options: OCROptions): Promise<OCRResult> {
    await this.initializeTesseract();

    const safePageCount = Math.max(1, pageCount);
    const maxPages = 20;
    const pagesToProcess = Math.min(safePageCount, maxPages);
    if (safePageCount > maxPages) {
      this.logger.warn(`PDF has ${safePageCount} pages; processing first ${maxPages} pages only`);
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mining-erp-ocr-'));
    const texts: string[] = [];
    let confidenceSum = 0;
    let processed = 0;

    try {
      for (let page = 0; page < pagesToProcess; page++) {
        const pngBuffer = await sharp(filePath, { density: 250, page })
          .png()
          .toBuffer();

        const {
          data: { text, confidence },
        } = await this.tesseractWorker.recognize(pngBuffer);

        const trimmed = (text || '').trim();
        if (trimmed) {
          texts.push(trimmed);
        }
        confidenceSum += Number.isFinite(confidence) ? confidence : 0;
        processed++;
      }

      return {
        text: texts.join('\n\n').trim(),
        confidence: processed > 0 ? Math.round((confidenceSum / processed) * 100) / 100 : 0,
        pageCount: pagesToProcess,
        processingTime: 0,
      };
    } catch (error) {
      this.logger.error('PDF page OCR failed', error);
      throw new Error(`PDF OCR processing failed: ${error.message}`);
    } finally {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }

  /**
   * Perform OCR using Tesseract.js
   */
  private async performTesseractOCR(
    filePath: string,
    options: OCROptions,
  ): Promise<OCRResult> {
    await this.initializeTesseract();

    try {
      // Set language if different from default
      if (options.language && options.language !== this.tesseractLanguage) {
        await this.tesseractWorker.reinitialize(options.language);
        this.tesseractLanguage = options.language;
      }

      // Perform OCR
      const {
        data: { text, confidence },
      } = await this.tesseractWorker.recognize(filePath);

      return {
        text: text.trim(),
        confidence: Math.round(confidence * 100) / 100,
        pageCount: 1,
        processingTime: 0, // Will be calculated by caller
      };
    } catch (error) {
      this.logger.error('Tesseract OCR failed', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Update document metadata with extracted text
   */
  private async updateDocumentMetadata(
    documentId: string,
    extractedText: string,
  ): Promise<void> {
    try {
      const existingMetadata = await this.prisma.documentMetadata.findUnique({
        where: { documentId },
      });

      if (existingMetadata) {
        await this.prisma.documentMetadata.update({
          where: { documentId },
          data: { extractedText },
        });
      } else {
        await this.prisma.documentMetadata.create({
          data: {
            documentId,
            extractedText,
          },
        });
      }
    } catch (error) {
      this.logger.error('Failed to update document metadata', error);
    }
  }

  /**
   * Get OCR job status
   */
  async getOCRJobStatus(jobId: string) {
    return this.prisma.oCRJob.findUnique({
      where: { id: jobId },
      include: {
        extractedData: true,
      },
    });
  }

  /**
   * Get OCR jobs for a document
   */
  async getDocumentOCRJobs(documentId: string) {
    return this.prisma.oCRJob.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        extractedData: true,
      },
    });
  }

  /**
   * Get extracted text for a document
   */
  async getExtractedText(documentId: string): Promise<string | null> {
    const metadata = await this.prisma.documentMetadata.findUnique({
      where: { documentId },
      select: { extractedText: true },
    });

    return metadata?.extractedText || null;
  }

  /**
   * Batch OCR processing
   */
  async batchExtractText(
    documentIds: string[],
    userId: string,
    options: OCROptions = {},
  ): Promise<{ jobId: string; documentId: string }[]> {
    const jobs: { jobId: string; documentId: string }[] = [];

    for (const documentId of documentIds) {
      try {
        const document = await this.prisma.document.findUnique({
          where: { id: documentId },
        });

        if (!document) {
          this.logger.warn(`Document ${documentId} not found, skipping`);
          continue;
        }

        // Create OCR job (actual processing will be done by queue)
        const ocrJob = await this.prisma.oCRJob.create({
          data: {
            documentId,
            provider: options.provider || OCRProvider.TESSERACT_JS,
            status: OCRStatus.PENDING,
            language: options.language || 'eng',
            autoRotate: options.autoRotate ?? true,
            enhanceImage: options.enhanceImage ?? true,
            priority: options.priority || 5,
            createdById: userId,
          },
        });

        jobs.push({ jobId: ocrJob.id, documentId });
      } catch (error) {
        this.logger.error(`Failed to create OCR job for document ${documentId}`, error);
      }
    }

    return jobs;
  }

  /**
   * Cancel OCR job
   */
  async cancelOCRJob(jobId: string, userId: string): Promise<void> {
    const job = await this.prisma.oCRJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new BadRequestException('OCR job not found');
    }

    if (job.status !== OCRStatus.PENDING && job.status !== OCRStatus.PROCESSING) {
      throw new BadRequestException('Can only cancel pending or processing jobs');
    }

    await this.prisma.oCRJob.update({
      where: { id: jobId },
      data: {
        status: OCRStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    await this.logOCRProcess(jobId, 'INFO', `Job cancelled by user ${userId}`);
  }

  /**
   * Log OCR processing event
   */
  private async logOCRProcess(
    ocrJobId: string,
    level: string,
    message: string,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.prisma.oCRProcessingLog.create({
        data: {
          ocrJobId,
          level,
          message,
          metadata: metadata || undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log OCR process', error);
    }
  }

  /**
   * Get OCR configuration
   */
  async getOCRConfiguration() {
    const config = await this.prisma.oCRConfiguration.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      // Return default configuration
      return {
        defaultProvider: OCRProvider.TESSERACT_JS,
        autoOCREnabled: false,
        autoOCRCategories: [],
        maxConcurrentJobs: 3,
        defaultLanguage: 'eng',
        confidenceThreshold: 70.0,
        autoCreateInvoice: false,
        autoCreateExpense: false,
        autoCreateContract: false,
        notifyOnCompletion: true,
        notifyOnFailure: true,
        retainRawText: true,
        retainExtractedData: true,
      };
    }

    return config;
  }

  /**
   * Update OCR configuration
   */
  async updateOCRConfiguration(userId: string, data: any) {
    const existingConfig = await this.prisma.oCRConfiguration.findFirst();

    if (existingConfig) {
      return this.prisma.oCRConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          ...data,
          updatedById: userId,
        },
      });
    } else {
      return this.prisma.oCRConfiguration.create({
        data: {
          ...data,
          updatedById: userId,
        },
      });
    }
  }

  /**
   * Cleanup - terminate Tesseract worker
   */
  async onModuleDestroy() {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.logger.log('Tesseract worker terminated');
    }
  }
}

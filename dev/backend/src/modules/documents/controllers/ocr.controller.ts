import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, OCRProvider, ExtractedDataType } from "@prisma/client";
import { OCRService } from "../services/ocr.service";
import { DataExtractionService } from "../services/data-extraction.service";
import { OCRQueueService } from "../services/ocr-queue.service";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { StorageService } from "../services/storage.service";

@Controller("documents/ocr")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OCRController {
  constructor(
    private readonly ocrService: OCRService,
    private readonly dataExtractionService: DataExtractionService,
    private readonly ocrQueueService: OCRQueueService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Extract text from document
   * POST /api/documents/:id/extract-text
   */
  @Post(":id/extract-text")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async extractText(
    @Param("id") documentId: string,
    @Body()
    body: {
      language?: string;
      provider?: OCRProvider;
      autoRotate?: boolean;
      enhanceImage?: boolean;
    },
    @Request() req: any,
  ) {
    // Get document
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    // Get file path from storage
    const filePath = await this.storageService.getLocalPath(
      document.fileUrl,
      document.fileName,
    );

    if (!filePath) {
      throw new BadRequestException("Document file not accessible");
    }

    const isTempFile = /[\\/]temp[\\/]/.test(filePath);

    try {
      // Perform OCR
      const result = await this.ocrService.extractText(
        documentId,
        filePath,
        req.user.userId,
        {
          language: body.language,
          provider: body.provider,
          autoRotate: body.autoRotate,
          enhanceImage: body.enhanceImage,
        },
        isTempFile,
      );

      return {
        success: true,
        data: result,
      };
    } finally {
      // Clean up temp file if needed
      if (isTempFile) {
        await this.storageService.cleanupTempFile(filePath);
      }
    }
  }

  /**
   * Parse invoice data from document
   * POST /api/documents/:id/parse-invoice
   */
  @Post(":id/parse-invoice")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  async parseInvoice(@Param("id") documentId: string, @Request() req: any) {
    // First, get or perform OCR
    const extractedText = await this.getOrExtractText(
      documentId,
      req.user.userId,
    );

    if (!extractedText) {
      throw new BadRequestException("Failed to extract text from document");
    }

    // Get the latest OCR job
    const ocrJobs = await this.ocrService.getDocumentOCRJobs(documentId);
    if (ocrJobs.length === 0) {
      throw new BadRequestException("No OCR job found for document");
    }

    const latestJob = ocrJobs[0];

    // Parse invoice data
    const invoiceData = await this.dataExtractionService.parseInvoice(
      latestJob.id,
      documentId,
      extractedText,
    );

    return {
      success: true,
      data: invoiceData,
    };
  }

  /**
   * Parse receipt data from document
   * POST /api/documents/:id/parse-receipt
   */
  @Post(":id/parse-receipt")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  async parseReceipt(@Param("id") documentId: string, @Request() req: any) {
    const extractedText = await this.getOrExtractText(
      documentId,
      req.user.userId,
    );

    if (!extractedText) {
      throw new BadRequestException("Failed to extract text from document");
    }

    const ocrJobs = await this.ocrService.getDocumentOCRJobs(documentId);
    if (ocrJobs.length === 0) {
      throw new BadRequestException("No OCR job found for document");
    }

    const latestJob = ocrJobs[0];

    const receiptData = await this.dataExtractionService.parseReceipt(
      latestJob.id,
      documentId,
      extractedText,
    );

    return {
      success: true,
      data: receiptData,
    };
  }

  /**
   * Parse contract data from document
   * POST /api/documents/:id/parse-contract
   */
  @Post(":id/parse-contract")
  @Roles(UserRole.SUPER_ADMIN, UserRole.CEO, UserRole.CFO)
  async parseContract(@Param("id") documentId: string, @Request() req: any) {
    const extractedText = await this.getOrExtractText(
      documentId,
      req.user.userId,
    );

    if (!extractedText) {
      throw new BadRequestException("Failed to extract text from document");
    }

    const ocrJobs = await this.ocrService.getDocumentOCRJobs(documentId);
    if (ocrJobs.length === 0) {
      throw new BadRequestException("No OCR job found for document");
    }

    const latestJob = ocrJobs[0];

    const contractData = await this.dataExtractionService.parseContract(
      latestJob.id,
      documentId,
      extractedText,
    );

    return {
      success: true,
      data: contractData,
    };
  }

  /**
   * Get extracted text for document
   * GET /api/documents/:id/extracted-text
   */
  @Get(":id/extracted-text")
  async getExtractedText(@Param("id") documentId: string) {
    const text = await this.ocrService.getExtractedText(documentId);

    if (!text) {
      throw new NotFoundException("No extracted text found for this document");
    }

    return {
      success: true,
      data: { text },
    };
  }

  /**
   * Batch OCR processing
   * POST /api/documents/batch-ocr
   */
  @Post("batch-ocr")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.IT_MANAGER,
  )
  async batchOCR(
    @Body()
    body: {
      documentIds: string[];
      language?: string;
      provider?: OCRProvider;
    },
    @Request() req: any,
  ) {
    if (!body.documentIds || body.documentIds.length === 0) {
      throw new BadRequestException("No document IDs provided");
    }

    const jobs = await this.ocrService.batchExtractText(
      body.documentIds,
      req.user.userId,
      {
        language: body.language,
        provider: body.provider,
      },
    );

    for (const job of jobs) {
      await this.ocrQueueService.enqueueJob(
        job.jobId,
        job.documentId,
        req.user.userId,
        {
          language: body.language,
          provider: body.provider,
        },
      );
    }

    return {
      success: true,
      data: {
        jobsCreated: jobs.length,
        jobs,
      },
    };
  }

  /**
   * Get OCR job status
   * GET /api/documents/ocr/jobs/:jobId
   */
  @Get("jobs/:jobId")
  async getJobStatus(@Param("jobId") jobId: string) {
    const job = await this.ocrService.getOCRJobStatus(jobId);

    if (!job) {
      throw new NotFoundException("OCR job not found");
    }

    return {
      success: true,
      data: job,
    };
  }

  /**
   * Get OCR jobs for document
   * GET /api/documents/:id/ocr-jobs
   */
  @Get(":id/ocr-jobs")
  async getDocumentOCRJobs(@Param("id") documentId: string) {
    const jobs = await this.ocrService.getDocumentOCRJobs(documentId);

    return {
      success: true,
      data: jobs,
    };
  }

  /**
   * Cancel OCR job
   * DELETE /api/documents/ocr/jobs/:jobId
   */
  @Delete("jobs/:jobId")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  async cancelJob(@Param("jobId") jobId: string, @Request() req: any) {
    await this.ocrService.cancelOCRJob(jobId, req.user.userId);

    return {
      success: true,
      message: "OCR job cancelled",
    };
  }

  /**
   * Get extracted data for document
   * GET /api/documents/:id/extracted-data
   */
  @Get(":id/extracted-data")
  async getExtractedData(
    @Param("id") documentId: string,
    @Query("type") type?: ExtractedDataType,
  ) {
    const data = await this.dataExtractionService.getExtractedData(
      documentId,
      type,
    );

    return {
      success: true,
      data,
    };
  }

  /**
   * Validate extracted data
   * PATCH /api/documents/ocr/extracted-data/:id/validate
   */
  @Patch("extracted-data/:id/validate")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
  )
  async validateExtractedData(
    @Param("id") extractedDataId: string,
    @Body()
    body: {
      correctedFields?: any;
      notes?: string;
    },
    @Request() req: any,
  ) {
    const validated = await this.dataExtractionService.validateExtractedData(
      extractedDataId,
      req.user.userId,
      body.correctedFields,
      body.notes,
    );

    return {
      success: true,
      data: validated,
    };
  }

  /**
   * Get OCR configuration
   * GET /api/documents/ocr/configuration
   */
  @Get("configuration")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  async getConfiguration() {
    const config = await this.ocrService.getOCRConfiguration();

    return {
      success: true,
      data: config,
    };
  }

  @Get("capabilities")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  async getCapabilities() {
    const capabilities = await this.ocrService.getOCREnvironmentCapabilities();

    return {
      success: true,
      data: capabilities,
    };
  }

  /**
   * Update OCR configuration
   * PATCH /api/documents/ocr/configuration
   */
  @Patch("configuration")
  @Roles(UserRole.SUPER_ADMIN, UserRole.IT_MANAGER)
  async updateConfiguration(@Body() body: any, @Request() req: any) {
    const config = await this.ocrService.updateOCRConfiguration(
      req.user.userId,
      body,
    );

    return {
      success: true,
      data: config,
    };
  }

  /**
   * Helper: Get or extract text from document
   */
  private async getOrExtractText(
    documentId: string,
    userId: string,
  ): Promise<string | null> {
    // Try to get existing extracted text
    let text = await this.ocrService.getExtractedText(documentId);

    if (!text) {
      // Perform OCR
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException("Document not found");
      }

      const filePath = await this.storageService.getLocalPath(
        document.fileUrl,
        document.fileName,
      );

      if (!filePath) {
        throw new BadRequestException("Document file not accessible");
      }

      const result = await this.ocrService.extractText(
        documentId,
        filePath,
        userId,
      );
      text = result.text;
    }

    return text;
  }
}

import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './services/storage.service';
import { FileUploadService } from './services/file-upload.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { SignatureService } from './services/signature.service';
import { SecurityService } from './services/security.service';
import { OCRService } from './services/ocr.service';
import { DataExtractionService } from './services/data-extraction.service';
import { OCRQueueService } from './services/ocr-queue.service';
import { OCRWebhookService } from './services/ocr-webhook.service';
import { OCRController } from './controllers/ocr.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController, OCRController],
  providers: [
    DocumentsService,
    StorageService,
    FileUploadService,
    PdfGeneratorService,
    SignatureService,
    SecurityService,
    OCRService,
    DataExtractionService,
    OCRQueueService,
    OCRWebhookService,
  ],
  exports: [
    DocumentsService, 
    StorageService, 
    PdfGeneratorService,
    SignatureService,
    SecurityService,
    OCRService,
    DataExtractionService,
    OCRQueueService,
    OCRWebhookService,
  ],
})
export class DocumentsModule {
  constructor(
    private readonly ocrService: OCRService,
    private readonly webhookService: OCRWebhookService,
    private readonly documentsService: DocumentsService,
    private readonly ocrQueueService: OCRQueueService,
  ) {
    // Set webhook service to avoid circular dependency
    this.ocrService.setWebhookService(this.webhookService);
    // Set OCR queue service for auto-OCR
    this.documentsService.setOCRQueueService(this.ocrQueueService);
  }
}

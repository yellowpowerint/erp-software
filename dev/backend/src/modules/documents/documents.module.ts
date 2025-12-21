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
import { PdfManipulatorController } from './controllers/pdf-manipulator.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PdfManipulatorService } from './services/pdf-manipulator.service';
import { DocumentCommentsController } from './controllers/document-comments.controller';
import { DocumentAnnotationsController } from './controllers/document-annotations.controller';
import { DocumentSharingController } from './controllers/document-sharing.controller';
import { DocumentPresenceController } from './controllers/document-presence.controller';
import { PublicShareController } from './controllers/public-share.controller';
import { DocumentCommentsService } from './services/document-comments.service';
import { DocumentAnnotationsService } from './services/document-annotations.service';
import { DocumentSharingService } from './services/document-sharing.service';
import { DocumentPresenceService } from './services/document-presence.service';
import { DocumentPermissionsController } from './controllers/document-permissions.controller';
import { DocumentPermissionsService } from './services/document-permissions.service';
import { DocumentConversionController } from './controllers/document-conversion.controller';
import { DocumentConversionService } from './services/document-conversion.service';
import { DocumentConversionQueueService } from './services/document-conversion-queue.service';
import { DocumentFormsController } from './controllers/document-forms.controller';
import { DocumentFormsService } from './services/document-forms.service';
import { AuditPackagesController } from './controllers/audit-packages.controller';
import { AuditPackagesService } from './services/audit-packages.service';
import { AuditPackagesQueueService } from './services/audit-packages-queue.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    DocumentsController,
    OCRController,
    PdfManipulatorController,
    DocumentCommentsController,
    DocumentAnnotationsController,
    DocumentSharingController,
    DocumentPresenceController,
    PublicShareController,
    DocumentPermissionsController,
    DocumentConversionController,
    DocumentFormsController,
    AuditPackagesController,
  ],
  providers: [
    DocumentsService,
    StorageService,
    FileUploadService,
    PdfGeneratorService,
    PdfManipulatorService,
    DocumentCommentsService,
    DocumentAnnotationsService,
    DocumentSharingService,
    DocumentPresenceService,
    DocumentPermissionsService,
    DocumentConversionService,
    DocumentConversionQueueService,
    DocumentFormsService,
    AuditPackagesService,
    AuditPackagesQueueService,
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
    PdfManipulatorService,
    DocumentCommentsService,
    DocumentAnnotationsService,
    DocumentSharingService,
    DocumentPresenceService,
    DocumentConversionService,
    DocumentFormsService,
    AuditPackagesService,
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

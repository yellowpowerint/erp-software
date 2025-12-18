import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './services/storage.service';
import { FileUploadService } from './services/file-upload.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { SignatureService } from './services/signature.service';
import { SecurityService } from './services/security.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    StorageService,
    FileUploadService,
    PdfGeneratorService,
    SignatureService,
    SecurityService,
  ],
  exports: [
    DocumentsService, 
    StorageService, 
    PdfGeneratorService,
    SignatureService,
    SecurityService,
  ],
})
export class DocumentsModule {}

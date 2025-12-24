import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { CsvController } from "./csv.controller";
import { CsvService } from "./csv.service";
import { CsvImportQueueService } from "./csv-import-queue.service";
import { CsvExportQueueService } from "./csv-export-queue.service";
import { CsvAuditService } from "./csv-audit.service";
import { BatchImportService } from "./batch-import.service";
import { MigrationService } from "./migration.service";
import { ScheduledExportService } from "./scheduled-export.service";
import { EmailService } from "./email.service";

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [CsvController],
  providers: [
    CsvService,
    CsvImportQueueService,
    CsvExportQueueService,
    CsvAuditService,
    BatchImportService,
    MigrationService,
    ScheduledExportService,
    EmailService,
  ],
  exports: [CsvService, EmailService],
})
export class CsvModule {}

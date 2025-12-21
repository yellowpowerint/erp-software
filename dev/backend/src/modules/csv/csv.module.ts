import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';
import { CsvImportQueueService } from './csv-import-queue.service';
import { CsvExportQueueService } from './csv-export-queue.service';

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [CsvController],
  providers: [CsvService, CsvImportQueueService, CsvExportQueueService],
  exports: [CsvService],
})
export class CsvModule {}

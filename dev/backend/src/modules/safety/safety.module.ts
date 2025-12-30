import { Module } from "@nestjs/common";
import { SafetyController } from "./safety.controller";
import { SafetyService } from "./safety.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvModule } from "../csv/csv.module";
import { StorageService } from "../documents/services/storage.service";

@Module({
  imports: [CsvModule],
  controllers: [SafetyController],
  providers: [SafetyService, PrismaService, StorageService],
  exports: [SafetyService],
})
export class SafetyModule {}

import { Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvModule } from "../csv/csv.module";

@Module({
  imports: [CsvModule],
  controllers: [OperationsController],
  providers: [OperationsService, PrismaService],
  exports: [OperationsService],
})
export class OperationsModule {}

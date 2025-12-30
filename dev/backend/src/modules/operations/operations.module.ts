import { Module } from "@nestjs/common";
import { OperationsController } from "./operations.controller";
import { OperationsService } from "./operations.service";
import { SitesController } from "./sites.controller";
import { SitesService } from "./sites.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvModule } from "../csv/csv.module";

@Module({
  imports: [CsvModule],
  controllers: [OperationsController, SitesController],
  providers: [OperationsService, SitesService, PrismaService],
  exports: [OperationsService, SitesService],
})
export class OperationsModule {}

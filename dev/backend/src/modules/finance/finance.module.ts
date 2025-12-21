import { Module } from "@nestjs/common";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { CsvModule } from "../csv/csv.module";

@Module({
  imports: [PrismaModule, CsvModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}

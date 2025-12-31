import { Module } from "@nestjs/common";
import { HrController } from "./hr.controller";
import { HrService } from "./hr.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvModule } from "../csv/csv.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [CsvModule, AiModule],
  controllers: [HrController],
  providers: [HrService, PrismaService],
  exports: [HrService],
})
export class HrModule {}

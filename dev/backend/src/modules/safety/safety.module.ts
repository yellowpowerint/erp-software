import { Module } from "@nestjs/common";
import { SafetyController } from "./safety.controller";
import { SafetyService } from "./safety.service";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [SafetyController],
  providers: [SafetyService, PrismaService],
  exports: [SafetyService],
})
export class SafetyModule {}

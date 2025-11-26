import { Module } from "@nestjs/common";
import { AssetsController } from "./assets.controller";
import { AssetsService } from "./assets.service";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [AssetsController],
  providers: [AssetsService, PrismaService],
  exports: [AssetsService],
})
export class AssetsModule {}

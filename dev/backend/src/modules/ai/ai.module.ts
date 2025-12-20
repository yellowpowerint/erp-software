import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { DocumentsModule } from "../documents/documents.module";
import { DocumentAiController } from "./document-ai.controller";
import { DocumentAiService } from "./document-ai.service";

@Module({
  imports: [PrismaModule, DocumentsModule],
  controllers: [AiController, DocumentAiController],
  providers: [AiService, DocumentAiService],
  exports: [AiService, DocumentAiService],
})
export class AiModule {}

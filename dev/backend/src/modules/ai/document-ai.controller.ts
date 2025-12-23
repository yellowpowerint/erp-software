import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { DocumentCategory, UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { DocumentAiService } from "./document-ai.service";
import {
  AnalyzeOptionsDto,
  DetectDuplicatesDto,
  DocumentQaDto,
  SmartSearchDto,
} from "./dto/document-ai.dto";

@Controller("ai/documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentAiController {
  constructor(private readonly documentAiService: DocumentAiService) {}

  @Post(":id/analyze")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async analyze(
    @Param("id") id: string,
    @Body() body: AnalyzeOptionsDto,
    @Request() req,
  ) {
    return this.documentAiService.analyzeDocument(
      id,
      req.user.userId,
      req.user.role as UserRole,
      !!body?.force,
    );
  }

  @Post(":id/categorize")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async categorize(@Param("id") id: string, @Request() req) {
    return this.documentAiService.categorizeDocument(
      id,
      req.user.userId,
      req.user.role as UserRole,
    );
  }

  @Post(":id/summarize")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async summarize(@Param("id") id: string, @Request() req) {
    return this.documentAiService.summarizeDocument(
      id,
      req.user.userId,
      req.user.role as UserRole,
    );
  }

  @Post(":id/extract-entities")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async extractEntities(@Param("id") id: string, @Request() req) {
    return this.documentAiService.extractDocumentEntities(
      id,
      req.user.userId,
      req.user.role as UserRole,
    );
  }

  @Post("smart-search")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async smartSearch(@Body() body: SmartSearchDto, @Request() req) {
    const category = body.category as DocumentCategory | undefined;
    const limit = body.limit ?? 10;
    return this.documentAiService.smartSearch(
      body.query,
      req.user.userId,
      req.user.role as UserRole,
      limit,
      category,
    );
  }

  @Get("similar/:id")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async similar(
    @Param("id") id: string,
    @Query("limit") limit: string | undefined,
    @Request() req,
  ) {
    const n = limit ? Math.max(1, Math.min(25, parseInt(limit, 10))) : 5;
    return this.documentAiService.similarDocuments(
      id,
      req.user.userId,
      req.user.role as UserRole,
      n,
    );
  }

  @Post("detect-duplicates")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async detectDuplicates(@Body() body: DetectDuplicatesDto, @Request() req) {
    return this.documentAiService.detectDuplicates(
      req.user.userId,
      req.user.role as UserRole,
      {
        documentId: body.documentId,
        fileHash: body.fileHash,
      },
    );
  }

  @Post(":id/qa")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
  )
  async qa(
    @Param("id") id: string,
    @Body() body: DocumentQaDto,
    @Request() req,
  ) {
    return this.documentAiService.askQuestion(
      id,
      body.question,
      req.user.userId,
      req.user.role as UserRole,
    );
  }
}

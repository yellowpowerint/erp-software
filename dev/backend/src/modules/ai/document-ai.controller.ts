import { Body, Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { DocumentCategory, UserRole } from '@prisma/client';
import { DocumentAiService } from './document-ai.service';
import { AnalyzeOptionsDto, DetectDuplicatesDto, DocumentQaDto, SmartSearchDto } from './dto/document-ai.dto';

@Controller('ai/documents')
export class DocumentAiController {
  constructor(private readonly documentAiService: DocumentAiService) {}

  @Post(':id/analyze')
  async analyze(@Param('id') id: string, @Body() body: AnalyzeOptionsDto, @Request() req) {
    return this.documentAiService.analyzeDocument(id, req.user.userId, req.user.role as UserRole, !!body?.force);
  }

  @Post(':id/categorize')
  async categorize(@Param('id') id: string, @Request() req) {
    return this.documentAiService.categorizeDocument(id, req.user.userId, req.user.role as UserRole);
  }

  @Post(':id/summarize')
  async summarize(@Param('id') id: string, @Request() req) {
    return this.documentAiService.summarizeDocument(id, req.user.userId, req.user.role as UserRole);
  }

  @Post(':id/extract-entities')
  async extractEntities(@Param('id') id: string, @Request() req) {
    return this.documentAiService.extractDocumentEntities(id, req.user.userId, req.user.role as UserRole);
  }

  @Post('smart-search')
  async smartSearch(@Body() body: SmartSearchDto, @Request() req) {
    const category = body.category as DocumentCategory | undefined;
    const limit = body.limit ?? 10;
    return this.documentAiService.smartSearch(body.query, req.user.userId, req.user.role as UserRole, limit, category);
  }

  @Get('similar/:id')
  async similar(@Param('id') id: string, @Query('limit') limit: string | undefined, @Request() req) {
    const n = limit ? Math.max(1, Math.min(25, parseInt(limit, 10))) : 5;
    return this.documentAiService.similarDocuments(id, req.user.userId, req.user.role as UserRole, n);
  }

  @Post('detect-duplicates')
  async detectDuplicates(@Body() body: DetectDuplicatesDto, @Request() req) {
    return this.documentAiService.detectDuplicates(req.user.userId, req.user.role as UserRole, {
      documentId: body.documentId,
      fileHash: body.fileHash,
    });
  }

  @Post(':id/qa')
  async qa(@Param('id') id: string, @Body() body: DocumentQaDto, @Request() req) {
    return this.documentAiService.askQuestion(id, body.question, req.user.userId, req.user.role as UserRole);
  }
}

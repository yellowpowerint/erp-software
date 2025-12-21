import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  Res,
  UseGuards,
  StreamableFile,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { DocumentFormsService } from "../services/document-forms.service";

@Controller("documents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentFormsController {
  constructor(private readonly documentFormsService: DocumentFormsService) {}

  @Post(":id/form-template")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async createTemplate(@Param("id") documentId: string, @Request() req: any) {
    const template = await this.documentFormsService.createOrGetTemplate(
      documentId,
      req.user.userId,
    );
    return { success: true, data: template };
  }

  @Get("form-templates")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async listTemplates(@Request() req: any) {
    const templates = await this.documentFormsService.listTemplates(
      req.user.userId,
    );
    return { success: true, data: templates };
  }

  @Get("form-templates/:templateId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async getTemplate(
    @Param("templateId") templateId: string,
    @Request() req: any,
  ) {
    const template = await this.documentFormsService.getTemplate(
      templateId,
      req.user.userId,
    );
    return { success: true, data: template };
  }

  @Delete("form-templates/:templateId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async deleteTemplate(
    @Param("templateId") templateId: string,
    @Request() req: any,
  ) {
    const result = await this.documentFormsService.deleteTemplate(
      templateId,
      req.user.userId,
    );
    return { success: true, data: result };
  }

  @Post(":id/form-drafts")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async createDraft(
    @Param("id") documentId: string,
    @Body() body: { templateId?: string },
    @Request() req: any,
  ) {
    const draft = await this.documentFormsService.createDraft(
      documentId,
      req.user.userId,
      {
        templateId: body?.templateId,
      },
    );
    return { success: true, data: draft };
  }

  @Get(":id/form-drafts")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async listDrafts(@Param("id") documentId: string, @Request() req: any) {
    const drafts = await this.documentFormsService.listDrafts(
      documentId,
      req.user.userId,
    );
    return { success: true, data: drafts };
  }

  @Get("form-drafts/:draftId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async getDraft(@Param("draftId") draftId: string, @Request() req: any) {
    const draft = await this.documentFormsService.getDraft(
      draftId,
      req.user.userId,
    );
    return { success: true, data: draft };
  }

  @Put("form-drafts/:draftId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async updateDraft(
    @Param("draftId") draftId: string,
    @Body()
    body: {
      values?: Record<string, any>;
      signatureData?: string | null;
      signatureType?: string | null;
      signatureReason?: string | null;
      signatureMetadata?: any;
    },
    @Request() req: any,
  ) {
    const draft = await this.documentFormsService.updateDraft(
      draftId,
      req.user.userId,
      body || {},
    );
    return { success: true, data: draft };
  }

  @Post("form-drafts/:draftId/render")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async render(
    @Param("draftId") draftId: string,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdf = await this.documentFormsService.renderDraftPdf(
      draftId,
      req.user.userId,
    );

    const fileName = `draft-preview-${draftId}.pdf`;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(pdf);
  }

  @Post("form-drafts/:draftId/finalize")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async finalize(@Param("draftId") draftId: string, @Request() req: any) {
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const result = await this.documentFormsService.finalizeDraft(
      draftId,
      req.user.userId,
      ipAddress,
      userAgent,
    );
    return { success: true, data: result };
  }

  @Delete("form-drafts/:draftId")
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.CEO,
    UserRole.CFO,
    UserRole.DEPARTMENT_HEAD,
    UserRole.ACCOUNTANT,
    UserRole.PROCUREMENT_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.IT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.SAFETY_OFFICER,
    UserRole.WAREHOUSE_MANAGER,
    UserRole.EMPLOYEE,
  )
  async cancel(@Param("draftId") draftId: string, @Request() req: any) {
    const result = await this.documentFormsService.cancelDraft(
      draftId,
      req.user.userId,
    );
    return { success: true, data: result };
  }
}

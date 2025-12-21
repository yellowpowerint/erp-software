import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { parse as json2csv } from "json2csv";
import { SafetyService } from "./safety.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("safety")
export class SafetyController {
  constructor(
    private readonly safetyService: SafetyService,
    private readonly prisma: PrismaService,
  ) {}

  // Inspections
  @Post("inspections")
  createInspection(@Body() body: any) {
    return this.safetyService.createInspection(body);
  }

  @Get("inspections")
  getInspections(
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.safetyService.getInspections({
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get("inspections/:id")
  getInspectionById(@Param("id") id: string) {
    return this.safetyService.getInspectionById(id);
  }

  @Put("inspections/:id")
  updateInspection(@Param("id") id: string, @Body() body: any) {
    return this.safetyService.updateInspection(id, body);
  }

  @Put("inspections/:id/complete")
  completeInspection(@Param("id") id: string, @Body() body: any) {
    return this.safetyService.completeInspection(id, body);
  }

  // Trainings
  @Post("trainings")
  createTraining(@Body() body: any) {
    return this.safetyService.createTraining(body);
  }

  @Get("trainings")
  getTrainings(
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.safetyService.getTrainings({
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get("trainings/:id")
  getTrainingById(@Param("id") id: string) {
    return this.safetyService.getTrainingById(id);
  }

  @Put("trainings/:id")
  updateTraining(@Param("id") id: string, @Body() body: any) {
    return this.safetyService.updateTraining(id, body);
  }

  @Put("trainings/:id/participants")
  addParticipants(
    @Param("id") id: string,
    @Body() body: { participants: string[] },
  ) {
    return this.safetyService.addParticipants(id, body.participants);
  }

  @Put("trainings/:id/complete")
  completeTraining(
    @Param("id") id: string,
    @Body() body: { completedBy: string[] },
  ) {
    return this.safetyService.completeTraining(id, body.completedBy);
  }

  // Certifications
  @Post("certifications")
  createCertification(@Body() body: any) {
    return this.safetyService.createCertification(body);
  }

  @Get("certifications")
  getCertifications(
    @Query("employeeId") employeeId?: string,
    @Query("status") status?: string,
  ) {
    return this.safetyService.getCertifications({ employeeId, status });
  }

  @Get("certifications/:id")
  getCertificationById(@Param("id") id: string) {
    return this.safetyService.getCertificationById(id);
  }

  @Put("certifications/:id/status")
  updateCertificationStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
  ) {
    return this.safetyService.updateCertificationStatus(id, body.status);
  }

  @Put("certifications/:id/renew")
  renewCertification(@Param("id") id: string, @Body() body: any) {
    return this.safetyService.renewCertification(id, body);
  }

  // Drills
  @Post("drills")
  createDrill(@Body() body: any) {
    return this.safetyService.createDrill(body);
  }

  @Get("drills")
  getDrills(
    @Query("type") type?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.safetyService.getDrills({
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get("drills/:id")
  getDrillById(@Param("id") id: string) {
    return this.safetyService.getDrillById(id);
  }

  @Put("drills/:id/complete")
  completeDrill(@Param("id") id: string, @Body() body: any) {
    return this.safetyService.completeDrill(id, body);
  }

  // Statistics
  @Get("stats")
  getSafetyStats() {
    return this.safetyService.getSafetyStats();
  }

  // ==================== CSV Exports (Session 17.2) ====================

  @Get("export/inspections")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "SAFETY_OFFICER", "OPERATIONS_MANAGER")
  async exportSafetyInspections(
    @Res({ passthrough: true }) res: Response,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const rows = await this.prisma.safetyInspection.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
    });
    const fields = [
      "inspectionId",
      "type",
      "status",
      "title",
      "location",
      "equipmentId",
      "assetId",
      "scheduledDate",
      "completedDate",
      "inspectedBy",
      "inspectorName",
      "passed",
      "score",
      "findings",
      "deficiencies",
      "recommendations",
      "actionRequired",
      "correctiveActions",
      "dueDate",
      "notes",
      "createdAt",
    ];

    const csv = json2csv(rows as any, { fields });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=safety-inspections-export.csv`,
    );
    return csv;
  }

  @Get("export/incidents")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "SAFETY_OFFICER", "OPERATIONS_MANAGER")
  async exportSafetyIncidents(
    @Res({ passthrough: true }) res: Response,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.incidentDate = {};
      if (startDate) where.incidentDate.gte = new Date(startDate);
      if (endDate) where.incidentDate.lte = new Date(endDate);
    }

    const rows = await this.prisma.safetyIncident.findMany({
      where,
      orderBy: { incidentDate: "desc" },
    });
    const fields = [
      "incidentNumber",
      "type",
      "severity",
      "status",
      "location",
      "incidentDate",
      "reportedBy",
      "reportedAt",
      "description",
      "injuries",
      "witnesses",
      "photoUrls",
      "rootCause",
      "correctiveActions",
      "oshaReportable",
      "investigatedBy",
      "investigatedAt",
      "resolvedAt",
      "notes",
      "createdAt",
    ];

    const csv = json2csv(rows as any, { fields });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=safety-incidents-export.csv`,
    );
    return csv;
  }

  @Get("export/training")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "SAFETY_OFFICER", "HR_MANAGER")
  async exportSafetyTraining(
    @Res({ passthrough: true }) res: Response,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }

    const rows = await this.prisma.safetyTraining.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
    });
    const fields = [
      "trainingId",
      "type",
      "status",
      "title",
      "description",
      "location",
      "duration",
      "maxParticipants",
      "scheduledDate",
      "startTime",
      "endTime",
      "instructorId",
      "instructorName",
      "participants",
      "completedBy",
      "attendanceCount",
      "passingScore",
      "completed",
      "completedDate",
      "topics",
      "materials",
      "certificateUrl",
      "notes",
      "createdAt",
    ];

    const csv = json2csv(rows as any, { fields });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=safety-training-export.csv`,
    );
    return csv;
  }
}

import { Controller, Get, Post, Put, Param, Query, Body } from "@nestjs/common";
import { SafetyService } from "./safety.service";

@Controller("safety")
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

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
}

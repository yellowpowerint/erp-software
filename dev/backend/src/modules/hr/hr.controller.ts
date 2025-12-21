import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { HrService } from "./hr.service";
import { CsvService } from "../csv/csv.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("hr")
export class HrController {
  constructor(
    private readonly hrService: HrService,
    private readonly csvService: CsvService,
  ) {}

  // Employees
  @Post("employees")
  createEmployee(@Body() body: any) {
    return this.hrService.createEmployee(body);
  }

  @Get("employees")
  getEmployees(
    @Query("department") department?: string,
    @Query("status") status?: string,
    @Query("employmentType") employmentType?: string,
  ) {
    return this.hrService.getEmployees({ department, status, employmentType });
  }

  @Get("employees/:id")
  getEmployeeById(@Param("id") id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Put("employees/:id")
  updateEmployee(@Param("id") id: string, @Body() body: any) {
    return this.hrService.updateEmployee(id, body);
  }

  @Delete("employees/:id")
  deleteEmployee(@Param("id") id: string) {
    return this.hrService.deleteEmployee(id);
  }

  // Attendance
  @Post("attendance")
  markAttendance(@Body() body: any) {
    return this.hrService.markAttendance(body);
  }

  @Get("attendance")
  getAttendance(
    @Query("employeeId") employeeId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.hrService.getAttendance({
      employeeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Leave Requests
  @Post("leave-requests")
  createLeaveRequest(@Body() body: any) {
    return this.hrService.createLeaveRequest(body);
  }

  @Get("leave-requests")
  getLeaveRequests(
    @Query("employeeId") employeeId?: string,
    @Query("status") status?: string,
    @Query("leaveType") leaveType?: string,
  ) {
    return this.hrService.getLeaveRequests({ employeeId, status, leaveType });
  }

  @Get("leave-requests/:id")
  getLeaveRequestById(@Param("id") id: string) {
    return this.hrService.getLeaveRequestById(id);
  }

  @Put("leave-requests/:id/status")
  updateLeaveStatus(@Param("id") id: string, @Body() body: any) {
    return this.hrService.updateLeaveStatus(id, body);
  }

  // Performance Reviews
  @Post("performance-reviews")
  createPerformanceReview(@Body() body: any) {
    return this.hrService.createPerformanceReview(body);
  }

  @Get("performance-reviews")
  getPerformanceReviews(@Query("employeeId") employeeId?: string) {
    return this.hrService.getPerformanceReviews({ employeeId });
  }

  // Statistics
  @Get("stats")
  getHrStats() {
    return this.hrService.getHrStats();
  }

  // ==================== CSV: Employees ====================

  @Post("employees/import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "HR_MANAGER")
  @UseInterceptors(FileInterceptor("file"))
  async importEmployees(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { mappings?: string; duplicateStrategy?: string },
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    const mappings = body.mappings
      ? this.csvService.parseJson(body.mappings, "mappings")
      : undefined;
    const context = { duplicateStrategy: body.duplicateStrategy };
    const job = await this.csvService.createImportJob(
      "employees",
      file,
      req.user.userId,
      mappings,
      context,
    );
    return { success: true, data: job };
  }

  @Get("employees/import/sample")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async downloadEmployeesSample(@Res({ passthrough: true }) res: Response) {
    const template = await this.csvService.getSampleTemplate("employees");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=employees-sample.csv`,
    );
    return template;
  }

  @Get("employees/export")
  @UseGuards(JwtAuthGuard, RolesGuard)
  async exportEmployees(
    @Query("department") department: string | undefined,
    @Query("status") status: string | undefined,
    @Query("employmentType") employmentType: string | undefined,
    @Query("columns") columns: string | undefined,
    @Request() req: any,
  ) {
    const cols = columns
      ? String(columns)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [
          "employeeId",
          "firstName",
          "lastName",
          "email",
          "phone",
          "department",
          "position",
          "employmentType",
          "status",
          "hireDate",
          "salary",
          "createdAt",
        ];

    const filters: any = {};
    if (department) filters.department = department;
    if (status) filters.status = status;
    if (employmentType) filters.employmentType = employmentType;

    const job = await this.csvService.createExportJob(
      "employees",
      filters,
      cols,
      req.user.userId,
      undefined,
    );
    return { success: true, data: job };
  }

  // Recruitment & AI HR Assistant
  @Post("recruitment/generate-job-description")
  generateJobDescription(@Body() body: any) {
    return this.hrService.generateJobDescription(body);
  }

  @Post("recruitment/jobs")
  createJobPosting(@Body() body: any) {
    return this.hrService.createJobPosting(body);
  }

  @Get("recruitment/jobs")
  getJobPostings(
    @Query("status") status?: string,
    @Query("department") department?: string,
  ) {
    return this.hrService.getJobPostings({ status, department });
  }

  @Get("recruitment/jobs/:id")
  getJobPostingById(@Param("id") id: string) {
    return this.hrService.getJobPostingById(id);
  }

  @Post("recruitment/candidates")
  createCandidate(@Body() body: any) {
    return this.hrService.createCandidate(body);
  }

  @Get("recruitment/candidates")
  getCandidates() {
    return this.hrService.getCandidates();
  }

  @Post("recruitment/parse-cv")
  parseCV(@Body() body: any) {
    return this.hrService.parseCV(body);
  }

  @Post("recruitment/applications")
  createApplication(@Body() body: any) {
    return this.hrService.createApplication(body);
  }

  @Get("recruitment/applications")
  getApplications(
    @Query("jobPostingId") jobPostingId?: string,
    @Query("candidateId") candidateId?: string,
    @Query("status") status?: string,
  ) {
    return this.hrService.getApplications({
      jobPostingId,
      candidateId,
      status,
    });
  }

  @Post("recruitment/screen-candidate")
  screenCandidate(@Body() body: any) {
    return this.hrService.screenCandidate(body);
  }

  @Post("recruitment/rank-candidates/:jobPostingId")
  rankCandidates(@Param("jobPostingId") jobPostingId: string) {
    return this.hrService.rankCandidates(jobPostingId);
  }

  @Post("recruitment/interviews")
  createInterview(@Body() body: any) {
    return this.hrService.createInterview(body);
  }

  @Get("recruitment/interviews")
  getInterviews(
    @Query("candidateId") candidateId?: string,
    @Query("status") status?: string,
  ) {
    return this.hrService.getInterviews({ candidateId, status });
  }

  @Post("recruitment/generate-interview-summary/:id")
  generateInterviewSummary(@Param("id") id: string) {
    return this.hrService.generateInterviewSummary(id);
  }

  @Get("recruitment/stats")
  getRecruitmentStats() {
    return this.hrService.getRecruitmentStats();
  }
}

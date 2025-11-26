import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { HrService } from './hr.service';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Employees
  @Post('employees')
  createEmployee(@Body() body: any) {
    return this.hrService.createEmployee(body);
  }

  @Get('employees')
  getEmployees(
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Query('employmentType') employmentType?: string,
  ) {
    return this.hrService.getEmployees({ department, status, employmentType });
  }

  @Get('employees/:id')
  getEmployeeById(@Param('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Put('employees/:id')
  updateEmployee(@Param('id') id: string, @Body() body: any) {
    return this.hrService.updateEmployee(id, body);
  }

  @Delete('employees/:id')
  deleteEmployee(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  // Attendance
  @Post('attendance')
  markAttendance(@Body() body: any) {
    return this.hrService.markAttendance(body);
  }

  @Get('attendance')
  getAttendance(
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.hrService.getAttendance({
      employeeId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // Leave Requests
  @Post('leave-requests')
  createLeaveRequest(@Body() body: any) {
    return this.hrService.createLeaveRequest(body);
  }

  @Get('leave-requests')
  getLeaveRequests(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('leaveType') leaveType?: string,
  ) {
    return this.hrService.getLeaveRequests({ employeeId, status, leaveType });
  }

  @Get('leave-requests/:id')
  getLeaveRequestById(@Param('id') id: string) {
    return this.hrService.getLeaveRequestById(id);
  }

  @Put('leave-requests/:id/status')
  updateLeaveStatus(@Param('id') id: string, @Body() body: any) {
    return this.hrService.updateLeaveStatus(id, body);
  }

  // Performance Reviews
  @Post('performance-reviews')
  createPerformanceReview(@Body() body: any) {
    return this.hrService.createPerformanceReview(body);
  }

  @Get('performance-reviews')
  getPerformanceReviews(@Query('employeeId') employeeId?: string) {
    return this.hrService.getPerformanceReviews({ employeeId });
  }

  // Statistics
  @Get('stats')
  getHrStats() {
    return this.hrService.getHrStats();
  }

  // Recruitment & AI HR Assistant
  @Post('recruitment/generate-job-description')
  generateJobDescription(@Body() body: any) {
    return this.hrService.generateJobDescription(body);
  }

  @Post('recruitment/jobs')
  createJobPosting(@Body() body: any) {
    return this.hrService.createJobPosting(body);
  }

  @Get('recruitment/jobs')
  getJobPostings(
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    return this.hrService.getJobPostings({ status, department });
  }

  @Get('recruitment/jobs/:id')
  getJobPostingById(@Param('id') id: string) {
    return this.hrService.getJobPostingById(id);
  }

  @Post('recruitment/candidates')
  createCandidate(@Body() body: any) {
    return this.hrService.createCandidate(body);
  }

  @Get('recruitment/candidates')
  getCandidates() {
    return this.hrService.getCandidates();
  }

  @Post('recruitment/parse-cv')
  parseCV(@Body() body: any) {
    return this.hrService.parseCV(body);
  }

  @Post('recruitment/applications')
  createApplication(@Body() body: any) {
    return this.hrService.createApplication(body);
  }

  @Get('recruitment/applications')
  getApplications(
    @Query('jobPostingId') jobPostingId?: string,
    @Query('candidateId') candidateId?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.getApplications({ jobPostingId, candidateId, status });
  }

  @Post('recruitment/screen-candidate')
  screenCandidate(@Body() body: any) {
    return this.hrService.screenCandidate(body);
  }

  @Post('recruitment/rank-candidates/:jobPostingId')
  rankCandidates(@Param('jobPostingId') jobPostingId: string) {
    return this.hrService.rankCandidates(jobPostingId);
  }

  @Post('recruitment/interviews')
  createInterview(@Body() body: any) {
    return this.hrService.createInterview(body);
  }

  @Get('recruitment/interviews')
  getInterviews(
    @Query('candidateId') candidateId?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.getInterviews({ candidateId, status });
  }

  @Post('recruitment/generate-interview-summary/:id')
  generateInterviewSummary(@Param('id') id: string) {
    return this.hrService.generateInterviewSummary(id);
  }

  @Get('recruitment/stats')
  getRecruitmentStats() {
    return this.hrService.getRecruitmentStats();
  }
}

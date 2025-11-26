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
}

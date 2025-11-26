import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // ==================== Employees ====================

  async createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    city?: string;
    department: string;
    position: string;
    employmentType: string;
    hireDate: Date;
    salary?: number;
    supervisorId?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) {
    const employeeCount = await this.prisma.employee.count();
    const employeeId = `EMP-${Date.now()}-${employeeCount + 1}`;

    return this.prisma.employee.create({
      data: {
        ...data,
        employeeId,
        employmentType: data.employmentType as any,
      },
    });
  }

  async getEmployees(filters?: {
    department?: string;
    status?: string;
    employmentType?: string;
  }) {
    const where: any = {};
    if (filters?.department) where.department = filters.department;
    if (filters?.status) where.status = filters.status;
    if (filters?.employmentType) where.employmentType = filters.employmentType;

    return this.prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEmployeeById(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        attendances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        leaveRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        performanceReviews: {
          orderBy: { reviewDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async updateEmployee(id: string, data: any) {
    await this.getEmployeeById(id);

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...data,
        employmentType: data.employmentType
          ? (data.employmentType as any)
          : undefined,
        status: data.status ? (data.status as any) : undefined,
      },
    });
  }

  async deleteEmployee(id: string) {
    await this.getEmployeeById(id);
    return this.prisma.employee.delete({ where: { id } });
  }

  // ==================== Attendance ====================

  async markAttendance(data: {
    employeeId: string;
    date: Date;
    status: string;
    checkIn?: Date;
    checkOut?: Date;
    workHours?: number;
    notes?: string;
    markedBy?: string;
  }) {
    return this.prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: data.date,
        },
      },
      update: {
        status: data.status as any,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        workHours: data.workHours,
        notes: data.notes,
        markedBy: data.markedBy,
      },
      create: {
        employeeId: data.employeeId,
        date: data.date,
        status: data.status as any,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        workHours: data.workHours,
        notes: data.notes,
        markedBy: data.markedBy,
      },
    });
  }

  async getAttendance(filters?: {
    employeeId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  // ==================== Leave Requests ====================

  async createLeaveRequest(data: {
    employeeId: string;
    leaveType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
  }) {
    return this.prisma.leaveRequest.create({
      data: {
        ...data,
        leaveType: data.leaveType as any,
      },
    });
  }

  async getLeaveRequests(filters?: {
    employeeId?: string;
    status?: string;
    leaveType?: string;
  }) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.status) where.status = filters.status;
    if (filters?.leaveType) where.leaveType = filters.leaveType;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLeaveRequestById(id: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async updateLeaveStatus(
    id: string,
    data: {
      status: string;
      approvedById?: string;
      rejectionReason?: string;
    },
  ) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: data.status as any,
        approvedById: data.approvedById,
        approvedAt: data.status === 'APPROVED' ? new Date() : undefined,
        rejectionReason: data.rejectionReason,
      },
    });
  }

  // ==================== Performance Reviews ====================

  async createPerformanceReview(data: {
    employeeId: string;
    reviewPeriod: string;
    reviewDate: Date;
    reviewerId: string;
    reviewerName: string;
    overallRating: string;
    technicalSkills?: number;
    communication?: number;
    teamwork?: number;
    productivity?: number;
    leadership?: number;
    strengths?: string;
    areasForImprovement?: string;
    goals?: string;
    comments?: string;
  }) {
    return this.prisma.performanceReview.create({
      data: {
        ...data,
        overallRating: data.overallRating as any,
      },
    });
  }

  async getPerformanceReviews(filters?: { employeeId?: string }) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.performanceReview.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { reviewDate: 'desc' },
    });
  }

  // ==================== Statistics ====================

  async getHrStats() {
    const [
      totalEmployees,
      activeEmployees,
      employeesByDepartment,
      pendingLeaves,
      todayAttendance,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.groupBy({
        by: ['department'],
        _count: true,
      }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      todayAttendance,
      employeesByDepartment: employeesByDepartment.map((item) => ({
        department: item.department,
        count: item._count,
      })),
    };
  }
}

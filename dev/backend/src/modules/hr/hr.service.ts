import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { LeaveStatus, LeaveType, UserRole } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AiService } from "../ai/ai.service";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";
import { UpdateLeaveStatusDto } from "./dto/update-leave-status.dto";

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  private canViewSensitiveEmployeeFields(role?: UserRole) {
    return role === "SUPER_ADMIN" || role === "HR_MANAGER";
  }

  private employeeDirectorySelect() {
    return {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      department: true,
      position: true,
      status: true,
      hireDate: true,
      createdAt: true,
      updatedAt: true,
    };
  }

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

  async updateLeaveStatusForUser(id: string, dto: UpdateLeaveStatusDto, user: any) {
    if (!this.isHrRole(user?.role)) {
      throw new BadRequestException("You do not have permission to update leave status");
    }

    if (dto.status === LeaveStatus.REJECTED) {
      const reason = String(dto.rejectionReason ?? "").trim();
      if (reason.length < 2) {
        throw new BadRequestException("rejectionReason is required when rejecting");
      }
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        approvedById: user?.userId ?? undefined,
        approvedAt: dto.status === LeaveStatus.APPROVED ? new Date() : undefined,
        rejectionReason: dto.status === LeaveStatus.REJECTED ? dto.rejectionReason ?? undefined : undefined,
      },
      include: { employee: true },
    });
  }

  async getEmployees(
    filters?: {
      search?: string;
    department?: string;
    status?: string;
    employmentType?: string;
    },
  ) {
    const where: any = {};
    const q = String(filters?.search ?? "").trim();
    if (q) {
      where.OR = [
        { employeeId: { contains: q, mode: "insensitive" } },
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { position: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filters?.department) where.department = filters.department;
    if (filters?.status) where.status = filters.status;
    if (filters?.employmentType) where.employmentType = filters.employmentType;

    return this.prisma.employee.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: this.employeeDirectorySelect(),
    });
  }

  async getEmployeeDirectoryProfile(id: string, _requesterRole?: UserRole) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: this.employeeDirectorySelect(),
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return employee;
  }

  private async getEmployeeByIdFull(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        attendances: {
          orderBy: { date: "desc" },
          take: 30,
        },
        leaveRequests: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        performanceReviews: {
          orderBy: { reviewDate: "desc" },
          take: 5,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    return employee;
  }

  async getEmployeeById(id: string, requesterRole?: UserRole) {
    if (this.canViewSensitiveEmployeeFields(requesterRole)) {
      return this.getEmployeeByIdFull(id);
    }

    return this.getEmployeeDirectoryProfile(id, requesterRole);
  }

  async updateEmployee(id: string, data: any) {
    await this.getEmployeeByIdFull(id);

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
    await this.getEmployeeByIdFull(id);
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
      orderBy: { date: "desc" },
    });
  }

  // ==================== Leave Requests ====================

  private isHrRole(role?: UserRole) {
    return role === "SUPER_ADMIN" || role === "HR_MANAGER";
  }

  private async resolveEmployeeForUser(user: { email?: string }, allowMissing = false) {
    const email = String(user?.email ?? "").trim().toLowerCase();
    if (!email) {
      if (allowMissing) return null;
      throw new BadRequestException("Authenticated user email is missing");
    }

    const employee = await this.prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      if (allowMissing) return null;
      throw new NotFoundException(
        "Employee record not found for current user. Ask HR to create/link your employee profile.",
      );
    }
    return employee;
  }

  private parseLeaveDates(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid startDate/endDate (must be ISO 8601 date string)");
    }
    if (start.getTime() > end.getTime()) {
      throw new BadRequestException("startDate must be on or before endDate");
    }
    return { start, end };
  }

  private computeTotalDaysInclusive(start: Date, end: Date) {
    const startUtc = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const endUtc = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    const diffDays = Math.floor((endUtc - startUtc) / (1000 * 60 * 60 * 24));
    const totalDays = diffDays + 1;
    if (!Number.isFinite(totalDays) || totalDays <= 0) {
      throw new BadRequestException("totalDays must be at least 1");
    }
    if (totalDays > 365) {
      throw new BadRequestException("Leave request is too long (max 365 days)");
    }
    return totalDays;
  }

  private async ensureNoOverlappingLeave(employeeId: string, start: Date, end: Date) {
    const existing = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        "This leave request overlaps with an existing pending/approved leave.",
      );
    }
  }

  async createLeaveRequestForUser(dto: CreateLeaveRequestDto, user: any) {
    const reason = String(dto.reason ?? "").trim();
    if (!reason || reason.length < 2) {
      throw new BadRequestException("reason is required (min 2 characters)");
    }

    const { start, end } = this.parseLeaveDates(dto.startDate, dto.endDate);
    const totalDays = this.computeTotalDaysInclusive(start, end);

    let employeeId: string;
    if (dto.employeeId && this.isHrRole(user?.role)) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true },
      });
      if (!employee) {
        throw new NotFoundException("Employee not found");
      }
      employeeId = employee.id;
    } else {
      const employee = await this.resolveEmployeeForUser(user);
      employeeId = employee.id;
    }

    await this.ensureNoOverlappingLeave(employeeId, start, end);

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: dto.leaveType as LeaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
      },
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
    });
  }

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
      orderBy: { createdAt: "desc" },
    });
  }

  async getLeaveRequestsForUser(
    filters: { employeeId?: string; status?: string; leaveType?: string },
    user: any,
  ) {
    if (this.isHrRole(user?.role)) {
      return this.getLeaveRequests(filters);
    }

    const employee = await this.resolveEmployeeForUser(user);
    return this.getLeaveRequests({ ...filters, employeeId: employee.id });
  }

  async getLeaveRequestById(id: string) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
      },
    });

    if (!leave) {
      throw new NotFoundException("Leave request not found");
    }

    return leave;
  }

  async getLeaveRequestByIdForUser(id: string, user: any) {
    const leave = await this.getLeaveRequestById(id);
    if (this.isHrRole(user?.role)) return leave;

    const employee = await this.resolveEmployeeForUser(user);
    if (leave.employeeId !== employee.id) {
      throw new NotFoundException("Leave request not found");
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
        approvedAt: data.status === "APPROVED" ? new Date() : undefined,
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
      orderBy: { reviewDate: "desc" },
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
      this.prisma.employee.count({ where: { status: "ACTIVE" } }),
      this.prisma.employee.groupBy({
        by: ["department"],
        _count: true,
      }),
      this.prisma.leaveRequest.count({ where: { status: "PENDING" } }),
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

  // ==================== Recruitment & AI HR Assistant ====================

  // Job Description Generator (AI)
  async generateJobDescription(data: {
    title: string;
    department: string;
    level?: string;
    requirements?: string;
  }) {
    type Out = {
      description: string;
      responsibilities: string;
      requirements: string;
      qualifications: string;
    };

    const out = await this.aiService.openAiJsonRuntime<Out>({
      system:
        "You are an HR assistant for a mining ERP. Generate structured job posting content. Output must be valid JSON with keys: description, responsibilities, requirements, qualifications. Keep each field concise and business-ready.",
      user:
        "Generate a job description package for: " +
        JSON.stringify({
          title: data.title,
          department: data.department,
          level: data.level ?? null,
          additionalRequirements: data.requirements ?? null,
        }),
      temperature: 0.2,
    });

    if (!out) {
      throw new ServiceUnavailableException(
        "AI is not configured. Set AI_ENABLED=true and OPENAI_API_KEY (or AI_OPENAI_API_KEY).",
      );
    }

    return {
      description: String(out.description ?? "").trim(),
      responsibilities: String(out.responsibilities ?? "").trim(),
      requirements: String(out.requirements ?? "").trim(),
      qualifications: String(out.qualifications ?? "").trim(),
    };
  }

  // Create Job Posting
  async createJobPosting(data: {
    title: string;
    department: string;
    location: string;
    jobType: string;
    description: string;
    requirements: string;
    responsibilities: string;
    qualifications: string;
    salaryMin?: number;
    salaryMax?: number;
    benefits?: string;
    openDate?: Date;
    closeDate?: Date;
    aiGenerated?: boolean;
    aiPrompt?: string;
    postedBy: string;
  }) {
    const jobCount = await this.prisma.jobPosting.count();
    const jobId = `JOB-${Date.now()}-${jobCount + 1}`;

    return this.prisma.jobPosting.create({
      data: {
        ...data,
        jobId,
        jobType: data.jobType as any,
      },
    });
  }

  async getJobPostings(filters?: { status?: string; department?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.department) where.department = filters.department;

    return this.prisma.jobPosting.findMany({
      where,
      include: {
        applications: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getJobPostingById(id: string) {
    return this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            candidate: true,
          },
        },
      },
    });
  }

  // CV Parsing (AI)
  async parseCV(data: { candidateId: string; resumeText: string }) {
    type Out = {
      skills: string[];
      experience?: string;
      education?: string;
      yearsExperience?: number;
      aiSummary?: string;
    };

    const out = await this.aiService.openAiJsonRuntime<Out>({
      system:
        "You are an HR assistant. Extract structured candidate info from resume text. Output valid JSON with keys: skills (string[]), experience (string), education (string), yearsExperience (number), aiSummary (string). Keep skills <= 20.",
      user:
        "Parse this resume into structured fields. Resume text: " +
        JSON.stringify({ resumeText: data.resumeText }),
      temperature: 0.2,
    });

    if (!out) {
      throw new ServiceUnavailableException(
        "AI is not configured. Set AI_ENABLED=true and OPENAI_API_KEY (or AI_OPENAI_API_KEY).",
      );
    }

    const skills = Array.isArray(out.skills)
      ? out.skills
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0)
          .slice(0, 20)
      : [];

    const yearsExperience =
      typeof out.yearsExperience === "number" && Number.isFinite(out.yearsExperience)
        ? Math.max(0, Math.round(out.yearsExperience))
        : undefined;

    return this.prisma.candidate.update({
      where: { id: data.candidateId },
      data: {
        cvParsed: true,
        resumeText: data.resumeText,
        skills,
        experience: out.experience ? String(out.experience).trim() : undefined,
        education: out.education ? String(out.education).trim() : undefined,
        yearsExperience,
        aiSummary: out.aiSummary ? String(out.aiSummary).trim() : undefined,
      },
    });
  }

  // Candidate Screening (AI)
  async screenCandidate(data: {
    applicationId: string;
    jobRequirements: string;
  }) {
    const application = await this.prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { candidate: true, jobPosting: true },
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    type Out = {
      aiScore: number;
      skillMatch: number;
      experienceMatch: number;
      cultureFit: number;
      aiRecommendation: string;
      aiStrengths: string[];
      aiWeaknesses: string[];
    };

    const out = await this.aiService.openAiJsonRuntime<Out>({
      system:
        "You are an HR recruitment screening assistant for a mining company. Score the candidate for the job. Output valid JSON with keys: aiScore, skillMatch, experienceMatch, cultureFit (0-100 numbers), aiRecommendation (string), aiStrengths (string[]), aiWeaknesses (string[]). Keep arrays <= 6.",
      user:
        "Screen this candidate application. Data: " +
        JSON.stringify({
          job: {
            title: application.jobPosting.title,
            department: application.jobPosting.department,
            location: application.jobPosting.location,
            jobType: application.jobPosting.jobType,
            requirements: data.jobRequirements || application.jobPosting.requirements,
            description: application.jobPosting.description,
          },
          candidate: {
            firstName: application.candidate.firstName,
            lastName: application.candidate.lastName,
            email: application.candidate.email,
            skills: application.candidate.skills,
            experience: application.candidate.experience,
            education: application.candidate.education,
            yearsExperience: application.candidate.yearsExperience,
            resumeText: application.candidate.resumeText,
          },
        }),
      temperature: 0.2,
    });

    if (!out) {
      throw new ServiceUnavailableException(
        "AI is not configured. Set AI_ENABLED=true and OPENAI_API_KEY (or AI_OPENAI_API_KEY).",
      );
    }

    const clamp = (n) => {
      const x = Number(n);
      if (!Number.isFinite(x)) return 0;
      return Math.max(0, Math.min(100, x));
    };

    const aiScore = clamp(out.aiScore);
    const skillMatch = clamp(out.skillMatch);
    const experienceMatch = clamp(out.experienceMatch);
    const cultureFit = clamp(out.cultureFit);

    const aiRecommendation = String(out.aiRecommendation ?? "").trim();
    const aiStrengths = Array.isArray(out.aiStrengths)
      ? out.aiStrengths.map((s) => String(s).trim()).filter(Boolean).slice(0, 6)
      : [];
    const aiWeaknesses = Array.isArray(out.aiWeaknesses)
      ? out.aiWeaknesses.map((s) => String(s).trim()).filter(Boolean).slice(0, 6)
      : [];

    await this.prisma.application.update({
      where: { id: data.applicationId },
      data: {
        aiScreened: true,
        aiScore,
        aiRecommendation,
        aiStrengths,
        aiWeaknesses,
        screenedAt: new Date(),
        overallScore: aiScore,
      },
    });

    await this.prisma.candidate.update({
      where: { id: application.candidateId },
      data: {
        aiSkillMatch: skillMatch,
        aiExperienceMatch: experienceMatch,
        aiCultureFit: cultureFit,
        aiSummary: aiRecommendation,
      },
    });

    return {
      aiScore,
      skillMatch,
      experienceMatch,
      cultureFit,
      aiRecommendation,
      aiStrengths,
      aiWeaknesses,
    };
  }

  // Create Candidate
  async createCandidate(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    resumeUrl?: string;
    resumeText?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  }) {
    const candidateCount = await this.prisma.candidate.count();
    const candidateId = `CAND-${Date.now()}-${candidateCount + 1}`;

    return this.prisma.candidate.create({
      data: {
        ...data,
        candidateId,
      },
    });
  }

  async getCandidates() {
    return this.prisma.candidate.findMany({
      include: {
        applications: {
          include: {
            jobPosting: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Create Application
  async createApplication(data: {
    jobPostingId: string;
    candidateId: string;
    coverLetter?: string;
  }) {
    return this.prisma.application.create({
      data,
    });
  }

  async getApplications(filters?: {
    jobPostingId?: string;
    candidateId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters?.jobPostingId) where.jobPostingId = filters.jobPostingId;
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.application.findMany({
      where,
      include: {
        candidate: true,
        jobPosting: true,
        interviews: true,
      },
      orderBy: { appliedAt: "desc" },
    });
  }

  // Rank Candidates (AI)
  async rankCandidates(jobPostingId: string) {
    const applications = await this.prisma.application.findMany({
      where: { jobPostingId, aiScreened: true },
      include: { candidate: true },
      orderBy: { aiScore: "desc" },
    });

    // Assign ranks
    for (let i = 0; i < applications.length; i++) {
      await this.prisma.application.update({
        where: { id: applications[i].id },
        data: { rank: i + 1 },
      });
    }

    return applications;
  }

  // Generate Interview Summary (AI)
  async generateInterviewSummary(interviewId: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        application: {
          include: { jobPosting: true },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException("Interview not found");
    }

    type Out = {
      aiSummary: string;
      aiKeyPoints: string[];
      aiRecommendation: string;
    };

    const out = await this.aiService.openAiJsonRuntime<Out>({
      system:
        "You are an HR assistant. Generate a concise interview summary for internal hiring records. Output valid JSON with keys: aiSummary (string), aiKeyPoints (string[]), aiRecommendation (string). Keep aiKeyPoints <= 8.",
      user:
        "Generate an interview summary from this data: " +
        JSON.stringify({
          candidate: {
            firstName: interview.candidate.firstName,
            lastName: interview.candidate.lastName,
            email: interview.candidate.email,
          },
          job: {
            title: interview.application.jobPosting.title,
            department: interview.application.jobPosting.department,
          },
          interview: {
            interviewType: interview.interviewType,
            scheduledDate: interview.scheduledDate,
            duration: interview.duration,
            interviewers: interview.interviewers,
            feedback: interview.feedback,
            rating: interview.rating,
          },
        }),
      temperature: 0.2,
    });

    if (!out) {
      throw new ServiceUnavailableException(
        "AI is not configured. Set AI_ENABLED=true and OPENAI_API_KEY (or AI_OPENAI_API_KEY).",
      );
    }

    const aiSummary = String(out.aiSummary ?? "").trim();
    const aiKeyPoints = Array.isArray(out.aiKeyPoints)
      ? out.aiKeyPoints.map((s) => String(s).trim()).filter(Boolean).slice(0, 8)
      : [];
    const aiRecommendation = String(out.aiRecommendation ?? "").trim();

    await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        aiSummary,
        aiKeyPoints,
        aiRecommendation,
      },
    });

    return { aiSummary, aiKeyPoints, aiRecommendation };
  }

  // Create Interview
  async createInterview(data: {
    applicationId: string;
    candidateId: string;
    interviewType: string;
    scheduledDate: Date;
    duration: number;
    location?: string;
    meetingLink?: string;
    interviewers: string[];
  }) {
    return this.prisma.interview.create({
      data,
    });
  }

  async getInterviews(filters?: { candidateId?: string; status?: string }) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.interview.findMany({
      where,
      include: {
        candidate: true,
        application: {
          include: { jobPosting: true },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });
  }

  // Recruitment Statistics
  async getRecruitmentStats() {
    const [
      totalJobs,
      openJobs,
      totalCandidates,
      totalApplications,
      pendingScreening,
      scheduledInterviews,
    ] = await Promise.all([
      this.prisma.jobPosting.count(),
      this.prisma.jobPosting.count({ where: { status: "OPEN" } }),
      this.prisma.candidate.count(),
      this.prisma.application.count(),
      this.prisma.application.count({
        where: { status: "SUBMITTED", aiScreened: false },
      }),
      this.prisma.interview.count({ where: { status: "SCHEDULED" } }),
    ]);

    return {
      totalJobs,
      openJobs,
      totalCandidates,
      totalApplications,
      pendingScreening,
      scheduledInterviews,
    };
  }
}

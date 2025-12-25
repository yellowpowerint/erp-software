import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSafetyIncidentDto, SafetyIncidentsListQueryDto } from "./dto";

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  private canSeeAllIncidents(role: string) {
    return [
      "SUPER_ADMIN",
      "SAFETY_OFFICER",
      "OPERATIONS_MANAGER",
      "DEPARTMENT_HEAD",
    ].includes(String(role));
  }

  async createIncident(userId: string, dto: CreateSafetyIncidentDto) {
    const incidentDate = new Date(dto.incidentDate);
    if (Number.isNaN(incidentDate.getTime())) {
      throw new BadRequestException("Invalid incidentDate");
    }

    const count = await this.prisma.safetyIncident.count();
    const incidentNumber = `INC-${Date.now()}-${count + 1}`;

    return this.prisma.safetyIncident.create({
      data: {
        incidentNumber,
        type: dto.type,
        severity: dto.severity,
        status: "REPORTED",
        location: dto.location,
        incidentDate,
        reportedBy: userId,
        description: dto.description,
        injuries: dto.injuries,
        witnesses: dto.witnesses ?? [],
        photoUrls: [],
        oshaReportable: dto.oshaReportable ?? false,
        notes: dto.notes,
      },
    });
  }

  async appendIncidentPhotos(incidentId: string, photoUrls: string[]) {
    const urls = (photoUrls ?? [])
      .map(String)
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) {
      return this.prisma.safetyIncident.findUnique({
        where: { id: incidentId },
      });
    }

    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id: incidentId },
    });
    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    const merged = Array.from(
      new Set([...(incident.photoUrls ?? []), ...urls]),
    );

    return this.prisma.safetyIncident.update({
      where: { id: incidentId },
      data: {
        photoUrls: merged,
      },
    });
  }

  async listIncidents(user: any, query: SafetyIncidentsListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const search = (query.search ?? "").trim();
    const hasSearch = search.length > 0;

    const mustBeMine =
      !this.canSeeAllIncidents(user?.role) || query.mine === true;
    const userId = String(user?.userId ?? "").trim();

    if (mustBeMine && !userId) {
      return {
        items: [],
        page,
        pageSize,
        total: 0,
        hasNextPage: false,
      };
    }

    const where: any = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(mustBeMine ? { reportedBy: userId } : {}),
      ...(hasSearch
        ? {
            OR: [
              { incidentNumber: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.safetyIncident.count({ where }),
      this.prisma.safetyIncident.findMany({
        where,
        select: {
          id: true,
          incidentNumber: true,
          type: true,
          severity: true,
          status: true,
          location: true,
          incidentDate: true,
          reportedAt: true,
          oshaReportable: true,
          photoUrls: true,
          reportedBy: true,
        },
        orderBy: { incidentDate: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items,
      page,
      pageSize,
      total,
      hasNextPage: skip + items.length < total,
    };
  }

  async getIncidentById(user: any, id: string) {
    const incident = await this.prisma.safetyIncident.findUnique({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    if (!this.canSeeAllIncidents(user?.role)) {
      const userId = String(user?.userId ?? "").trim();
      if (!userId) {
        throw new ForbiddenException("You do not have access to this incident");
      }
      if (String(incident.reportedBy) !== userId) {
        throw new ForbiddenException("You do not have access to this incident");
      }
    }

    return incident;
  }

  // ==================== Safety Inspections ====================

  async createInspection(data: {
    type: string;
    title: string;
    location: string;
    equipmentId?: string;
    assetId?: string;
    scheduledDate: Date;
    inspectedBy?: string;
    inspectorName?: string;
  }) {
    const count = await this.prisma.safetyInspection.count();
    const inspectionId = `INSP-${Date.now()}-${count + 1}`;

    return this.prisma.safetyInspection.create({
      data: {
        ...data,
        inspectionId,
        type: data.type as any,
      },
    });
  }

  async getInspections(filters?: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = filters.startDate;
      if (filters.endDate) where.scheduledDate.lte = filters.endDate;
    }

    return this.prisma.safetyInspection.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
    });
  }

  async getInspectionById(id: string) {
    const inspection = await this.prisma.safetyInspection.findUnique({
      where: { id },
    });

    if (!inspection) {
      throw new NotFoundException("Inspection not found");
    }

    return inspection;
  }

  async updateInspection(id: string, data: any) {
    await this.getInspectionById(id);

    return this.prisma.safetyInspection.update({
      where: { id },
      data: {
        ...data,
        type: data.type ? (data.type as any) : undefined,
        status: data.status ? (data.status as any) : undefined,
      },
    });
  }

  async completeInspection(
    id: string,
    data: {
      passed: boolean;
      score?: number;
      findings?: string;
      deficiencies?: string[];
      recommendations?: string;
      actionRequired?: boolean;
      correctiveActions?: string;
      dueDate?: Date;
      checklistItems?: string[];
      photoUrls?: string[];
      notes?: string;
    },
  ) {
    return this.prisma.safetyInspection.update({
      where: { id },
      data: {
        ...data,
        status: "COMPLETED",
        completedDate: new Date(),
      },
    });
  }

  // ==================== Safety Training ====================

  async createTraining(data: {
    type: string;
    title: string;
    description?: string;
    location?: string;
    duration: number;
    maxParticipants?: number;
    scheduledDate: Date;
    startTime?: string;
    endTime?: string;
    instructorId?: string;
    instructorName: string;
    topics?: string[];
    materials?: string[];
  }) {
    const count = await this.prisma.safetyTraining.count();
    const trainingId = `TRN-${Date.now()}-${count + 1}`;

    return this.prisma.safetyTraining.create({
      data: {
        ...data,
        trainingId,
        type: data.type as any,
        topics: data.topics || [],
        materials: data.materials || [],
        participants: [],
        completedBy: [],
      },
    });
  }

  async getTrainings(filters?: {
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = filters.startDate;
      if (filters.endDate) where.scheduledDate.lte = filters.endDate;
    }

    return this.prisma.safetyTraining.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
    });
  }

  async getTrainingById(id: string) {
    const training = await this.prisma.safetyTraining.findUnique({
      where: { id },
    });

    if (!training) {
      throw new NotFoundException("Training not found");
    }

    return training;
  }

  async updateTraining(id: string, data: any) {
    await this.getTrainingById(id);

    return this.prisma.safetyTraining.update({
      where: { id },
      data: {
        ...data,
        type: data.type ? (data.type as any) : undefined,
        status: data.status ? (data.status as any) : undefined,
      },
    });
  }

  async addParticipants(id: string, participants: string[]) {
    const training = await this.getTrainingById(id);

    return this.prisma.safetyTraining.update({
      where: { id },
      data: {
        participants: [...new Set([...training.participants, ...participants])],
      },
    });
  }

  async completeTraining(id: string, completedBy: string[]) {
    return this.prisma.safetyTraining.update({
      where: { id },
      data: {
        completedBy,
        attendanceCount: completedBy.length,
        completed: true,
        completedDate: new Date(),
        status: "COMPLETED",
      },
    });
  }

  // ==================== Safety Certifications ====================

  async createCertification(data: {
    employeeId: string;
    employeeName: string;
    certType: string;
    certName: string;
    certNumber?: string;
    issuingBody: string;
    issueDate: Date;
    expiryDate: Date;
    certificateUrl?: string;
    documentUrls?: string[];
  }) {
    const count = await this.prisma.safetyCertification.count();
    const certificationId = `CERT-${Date.now()}-${count + 1}`;

    return this.prisma.safetyCertification.create({
      data: {
        ...data,
        certificationId,
        documentUrls: data.documentUrls || [],
      },
    });
  }

  async getCertifications(filters?: { employeeId?: string; status?: string }) {
    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.safetyCertification.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    });
  }

  async getCertificationById(id: string) {
    const cert = await this.prisma.safetyCertification.findUnique({
      where: { id },
    });

    if (!cert) {
      throw new NotFoundException("Certification not found");
    }

    return cert;
  }

  async updateCertificationStatus(id: string, status: string) {
    return this.prisma.safetyCertification.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async renewCertification(
    id: string,
    data: {
      issueDate: Date;
      expiryDate: Date;
      renewalDate: Date;
      certificateUrl?: string;
    },
  ) {
    return this.prisma.safetyCertification.update({
      where: { id },
      data: {
        ...data,
        status: "ACTIVE",
      },
    });
  }

  // ==================== Safety Drills ====================

  async createDrill(data: {
    type: string;
    title: string;
    description?: string;
    location: string;
    scheduledDate: Date;
    startTime?: string;
    endTime?: string;
    expectedCount?: number;
    coordinator: string;
    coordinatorName: string;
    observers?: string[];
    objectives?: string[];
  }) {
    const count = await this.prisma.safetyDrill.count();
    const drillId = `DRILL-${Date.now()}-${count + 1}`;

    return this.prisma.safetyDrill.create({
      data: {
        ...data,
        drillId,
        type: data.type as any,
        participants: [],
        observers: data.observers || [],
        objectives: data.objectives || [],
        strengths: [],
        areasForImprovement: [],
      },
    });
  }

  async getDrills(filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = filters.startDate;
      if (filters.endDate) where.scheduledDate.lte = filters.endDate;
    }

    return this.prisma.safetyDrill.findMany({
      where,
      orderBy: { scheduledDate: "desc" },
    });
  }

  async getDrillById(id: string) {
    const drill = await this.prisma.safetyDrill.findUnique({
      where: { id },
    });

    if (!drill) {
      throw new NotFoundException("Drill not found");
    }

    return drill;
  }

  async completeDrill(
    id: string,
    data: {
      actualCount: number;
      participants: string[];
      successRating?: number;
      results?: string;
      strengths?: string[];
      areasForImprovement?: string[];
      lessonsLearned?: string;
      followUpActions?: string;
      actionRequired?: boolean;
    },
  ) {
    return this.prisma.safetyDrill.update({
      where: { id },
      data: {
        ...data,
        completed: true,
        completedDate: new Date(),
        strengths: data.strengths || [],
        areasForImprovement: data.areasForImprovement || [],
      },
    });
  }

  // ==================== Statistics ====================

  async getSafetyStats() {
    const [
      totalInspections,
      pendingInspections,
      failedInspections,
      totalTrainings,
      upcomingTrainings,
      activeCertifications,
      expiringCertifications,
      scheduledDrills,
    ] = await Promise.all([
      this.prisma.safetyInspection.count(),
      this.prisma.safetyInspection.count({
        where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      }),
      this.prisma.safetyInspection.count({ where: { status: "FAILED" } }),
      this.prisma.safetyTraining.count(),
      this.prisma.safetyTraining.count({
        where: {
          status: "SCHEDULED",
          scheduledDate: { gte: new Date() },
        },
      }),
      this.prisma.safetyCertification.count({ where: { status: "ACTIVE" } }),
      this.prisma.safetyCertification.count({
        where: { status: "EXPIRING_SOON" },
      }),
      this.prisma.safetyDrill.count({
        where: {
          completed: false,
          scheduledDate: { gte: new Date() },
        },
      }),
    ]);

    return {
      totalInspections,
      pendingInspections,
      failedInspections,
      totalTrainings,
      upcomingTrainings,
      activeCertifications,
      expiringCertifications,
      scheduledDrills,
    };
  }
}

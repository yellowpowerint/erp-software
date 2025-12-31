import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class CareersService {
  constructor(private prisma: PrismaService) {}

  async getPublicJobs(filters?: { category?: string; location?: string; type?: string }) {
    const where: any = { status: 'OPEN' };
    if (filters?.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters?.type) where.jobType = filters.type;
    if (filters?.category) where.department = { contains: filters.category, mode: 'insensitive' };

    return this.prisma.jobPosting.findMany({
      where,
      orderBy: { openDate: 'desc' },
      select: {
        id: true,
        jobId: true,
        title: true,
        department: true,
        location: true,
        jobType: true,
        description: true,
        requirements: true,
        responsibilities: true,
        qualifications: true,
        benefits: true,
        openDate: true,
        salaryMin: true,
        salaryMax: true,
      },
    });
  }

  async getJobById(jobId: string) {
    return this.prisma.jobPosting.findFirst({
      where: { jobId, status: 'OPEN' },
    });
  }

  async createPublicApplication(dto: CreateApplicationDto) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: dto.jobPostingId },
    });
    if (!job) throw new Error('Job not found');

    let candidate = await this.prisma.candidate.findFirst({
      where: { email: dto.email },
    });

    if (!candidate) {
      candidate = await this.prisma.candidate.create({
        data: {
          candidateId: 'CAN-' + Date.now(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          resumeText: dto.resumeText,
          linkedinUrl: dto.linkedinUrl,
        },
      });
    }

    const application = await this.prisma.application.create({
      data: {
        jobPostingId: dto.jobPostingId,
        candidateId: candidate.id,
        status: 'SUBMITTED',
        coverLetter: dto.coverLetter,
      },
    });

    return { success: true, applicationId: application.id };
  }
}

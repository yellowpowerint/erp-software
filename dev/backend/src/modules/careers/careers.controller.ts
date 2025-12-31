import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { CareersService } from './careers.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('public/careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  @Get('jobs')
  async getPublicJobs(
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
  ) {
    return this.careersService.getPublicJobs({ category, location, type });
  }

  @Get('jobs/:jobId')
  async getJobById(@Param('jobId') jobId: string) {
    return this.careersService.getJobById(jobId);
  }

  @Post('apply')
  async createApplication(@Body() dto: CreateApplicationDto) {
    return this.careersService.createPublicApplication(dto);
  }
}

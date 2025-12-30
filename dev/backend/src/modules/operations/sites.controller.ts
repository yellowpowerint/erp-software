import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('sites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  createSite(@Body() dto: CreateSiteDto, @Request() req) {
    return this.sitesService.createSite(dto, req.user.userId);
  }

  @Get()
  getSites(@Query('type') type?: string, @Query('status') status?: string) {
    return this.sitesService.getSites(type, status);
  }

  @Get('stats')
  getSiteStats() {
    return this.sitesService.getSiteStats();
  }

  @Get(':id')
  getSiteById(@Param('id') id: string) {
    return this.sitesService.getSiteById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'CEO', 'OPERATIONS_MANAGER')
  updateSite(@Param('id') id: string, @Body() dto: Partial<CreateSiteDto>) {
    return this.sitesService.updateSite(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'CEO')
  deleteSite(@Param('id') id: string) {
    return this.sitesService.deleteSite(id);
  }
}

import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  siteCode: string;

  @IsString()
  name: string;

  @IsEnum(['MINING', 'CONSTRUCTION', 'CLEANING', 'MAINTENANCE', 'EXPLORATION', 'PROCESSING', 'STORAGE', 'OFFICE', 'OTHER'])
  type: string;

  @IsEnum(['ACTIVE', 'INACTIVE', 'UNDER_DEVELOPMENT', 'SUSPENDED', 'CLOSED', 'PLANNED'])
  @IsOptional()
  status?: string;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  coordinates?: string;

  @IsNumber()
  @IsOptional()
  area?: number;

  @IsString()
  @IsOptional()
  areaUnit?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  managerId?: string;

  @IsString()
  @IsOptional()
  managerName?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  operatingHours?: string;

  @IsDateString()
  @IsOptional()
  establishedDate?: string;

  @IsDateString()
  @IsOptional()
  closedDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

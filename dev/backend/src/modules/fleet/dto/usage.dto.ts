import {
  IsBoolean,
  IsISO8601,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateUsageLogDto {
  @IsString()
  assetId: string;

  @IsISO8601()
  date: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsString()
  shift?: string;

  @IsString()
  operatorId: string;

  @IsString()
  siteLocation: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsNumberString()
  startOdometer?: string;

  @IsOptional()
  @IsNumberString()
  endOdometer?: string;

  @IsOptional()
  @IsNumberString()
  distanceCovered?: string;

  @IsOptional()
  @IsNumberString()
  startHours?: string;

  @IsOptional()
  @IsNumberString()
  endHours?: string;

  @IsOptional()
  @IsNumberString()
  operatingHours?: string;

  @IsOptional()
  @IsNumberString()
  idleHours?: string;

  @IsOptional()
  @IsString()
  workDescription?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  loadsCarried?: number;

  @IsOptional()
  @IsNumberString()
  materialMoved?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tripsCompleted?: number;

  @IsOptional()
  @IsBoolean()
  preOpCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  postOpCheck?: boolean;

  @IsOptional()
  @IsString()
  issuesReported?: string;

  @IsOptional()
  @IsNumberString()
  fuelAdded?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UsageQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  siteLocation?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class UsageSummaryQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

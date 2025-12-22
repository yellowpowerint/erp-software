import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  PREDICTIVE = "PREDICTIVE",
  EMERGENCY = "EMERGENCY",
  INSPECTION = "INSPECTION",
  OVERHAUL = "OVERHAUL",
}

export enum ScheduleFrequency {
  TIME_BASED = "TIME_BASED",
  DISTANCE_BASED = "DISTANCE_BASED",
  HOURS_BASED = "HOURS_BASED",
  COMBINED = "COMBINED",
}

export enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export class CreateMaintenanceScheduleDto {
  @IsString()
  assetId: string;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @IsInt()
  @Min(1)
  intervalValue: number;

  @IsString()
  intervalUnit: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  alertDaysBefore?: number;

  @IsOptional()
  @IsNumberString()
  alertKmBefore?: string;

  @IsOptional()
  @IsNumberString()
  alertHoursBefore?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsNumberString()
  estimatedCost?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDuration?: number;
}

export class UpdateMaintenanceScheduleDto {
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @IsOptional()
  @IsInt()
  @Min(1)
  intervalValue?: number;

  @IsOptional()
  @IsString()
  intervalUnit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  alertDaysBefore?: number;

  @IsOptional()
  @IsNumberString()
  alertKmBefore?: string;

  @IsOptional()
  @IsNumberString()
  alertHoursBefore?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsNumberString()
  estimatedCost?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDuration?: number;
}

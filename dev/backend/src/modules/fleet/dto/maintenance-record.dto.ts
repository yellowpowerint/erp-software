import { IsEnum, IsISO8601, IsInt, IsNumberString, IsOptional, IsString, Min } from "class-validator";
import { MaintenanceType, Priority } from "./maintenance-schedule.dto";

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
}

export class CreateMaintenanceRecordDto {
  @IsString()
  assetId: string;

  @IsOptional()
  @IsString()
  scheduleId?: string;

  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  scheduledDate?: string;

  @IsISO8601()
  startDate: string;

  @IsOptional()
  @IsNumberString()
  downtime?: string;

  @IsOptional()
  @IsNumberString()
  odometerReading?: string;

  @IsOptional()
  @IsNumberString()
  hoursReading?: string;

  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  performedById?: string;
}

export class UpdateMaintenanceRecordDto {
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsISO8601()
  scheduledDate?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsNumberString()
  downtime?: string;

  @IsOptional()
  @IsNumberString()
  odometerReading?: string;

  @IsOptional()
  @IsNumberString()
  hoursReading?: string;

  @IsOptional()
  @IsString()
  workPerformed?: string;

  @IsOptional()
  @IsString()
  partsReplaced?: string;

  @IsOptional()
  @IsString()
  technicianNotes?: string;

  @IsOptional()
  @IsNumberString()
  laborCost?: string;

  @IsOptional()
  @IsNumberString()
  partsCost?: string;

  @IsOptional()
  @IsNumberString()
  externalCost?: string;

  @IsOptional()
  @IsString()
  serviceProvider?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  performedById?: string;

  @IsOptional()
  @IsString()
  approvedById?: string;
}

export class CompleteMaintenanceRecordDto {
  @IsOptional()
  @IsISO8601()
  completionDate?: string;

  @IsOptional()
  @IsNumberString()
  downtime?: string;

  @IsOptional()
  @IsNumberString()
  odometerReading?: string;

  @IsOptional()
  @IsNumberString()
  hoursReading?: string;

  @IsOptional()
  @IsString()
  workPerformed?: string;

  @IsOptional()
  @IsString()
  partsReplaced?: string;

  @IsOptional()
  @IsString()
  technicianNotes?: string;

  @IsOptional()
  @IsNumberString()
  laborCost?: string;

  @IsOptional()
  @IsNumberString()
  partsCost?: string;

  @IsOptional()
  @IsNumberString()
  externalCost?: string;

  @IsOptional()
  @IsString()
  approvedById?: string;
}

export class CancelMaintenanceRecordDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpcomingMaintenanceQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  daysAhead?: number;
}

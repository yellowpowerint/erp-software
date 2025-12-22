import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum BreakdownCategory {
  MECHANICAL = "MECHANICAL",
  ELECTRICAL = "ELECTRICAL",
  HYDRAULIC = "HYDRAULIC",
  ENGINE = "ENGINE",
  TRANSMISSION = "TRANSMISSION",
  TIRES_TRACKS = "TIRES_TRACKS",
  STRUCTURAL = "STRUCTURAL",
  OPERATOR_ERROR = "OPERATOR_ERROR",
  EXTERNAL_DAMAGE = "EXTERNAL_DAMAGE",
  OTHER = "OTHER",
}

export enum Severity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum BreakdownStatus {
  REPORTED = "REPORTED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  DIAGNOSING = "DIAGNOSING",
  AWAITING_PARTS = "AWAITING_PARTS",
  IN_REPAIR = "IN_REPAIR",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export class CreateBreakdownDto {
  @IsString()
  assetId: string;

  @IsISO8601()
  breakdownDate: string;

  @IsString()
  location: string;

  @IsString()
  siteLocation: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(BreakdownCategory)
  category: BreakdownCategory;

  @IsEnum(Severity)
  severity: Severity;

  @IsOptional()
  @IsString()
  operationalImpact?: string;

  @IsOptional()
  @IsNumberString()
  estimatedDowntime?: string;

  @IsOptional()
  @IsNumberString()
  productionLoss?: string;

  @IsOptional()
  @IsString()
  maintenanceRecordId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}

export class UpdateBreakdownDto {
  @IsOptional()
  @IsISO8601()
  breakdownDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  siteLocation?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BreakdownCategory)
  category?: BreakdownCategory;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsString()
  operationalImpact?: string;

  @IsOptional()
  @IsNumberString()
  estimatedDowntime?: string;

  @IsOptional()
  @IsNumberString()
  actualDowntime?: string;

  @IsOptional()
  @IsNumberString()
  productionLoss?: string;

  @IsOptional()
  @IsEnum(BreakdownStatus)
  status?: BreakdownStatus;

  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsISO8601()
  resolvedDate?: string;

  @IsOptional()
  @IsString()
  repairType?: string;

  @IsOptional()
  @IsNumberString()
  repairCost?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}

export class AssignBreakdownDto {
  @IsString()
  assignedToId: string;

  @IsOptional()
  @IsEnum(BreakdownStatus)
  status?: BreakdownStatus;
}

export class ResolveBreakdownDto {
  @IsOptional()
  @IsString()
  rootCause?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsISO8601()
  resolvedDate?: string;

  @IsOptional()
  @IsNumberString()
  actualDowntime?: string;

  @IsOptional()
  @IsString()
  repairType?: string;

  @IsOptional()
  @IsNumberString()
  repairCost?: string;

  @IsOptional()
  @IsString()
  partsUsed?: string;

  @IsOptional()
  @IsEnum(BreakdownStatus)
  status?: BreakdownStatus;
}

export class BreakdownQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsEnum(BreakdownStatus)
  status?: BreakdownStatus;

  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @IsOptional()
  @IsEnum(BreakdownCategory)
  category?: BreakdownCategory;

  @IsOptional()
  @IsString()
  siteLocation?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

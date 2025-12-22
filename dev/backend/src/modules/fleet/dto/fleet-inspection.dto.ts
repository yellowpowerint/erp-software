import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { InspectionResult } from "@prisma/client";

export enum FleetInspectionType {
  PRE_OPERATION = "PRE_OPERATION",
  POST_OPERATION = "POST_OPERATION",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  SAFETY = "SAFETY",
  REGULATORY = "REGULATORY",
}

export type FleetChecklistItemResult = {
  item: string;
  passed: boolean;
  notes?: string;
};

export class CreateFleetInspectionDto {
  @IsString()
  assetId: string;

  @IsEnum(FleetInspectionType)
  type: FleetInspectionType;

  @IsISO8601()
  inspectionDate: string;

  @IsString()
  inspectorId: string;

  @IsString()
  overallResult: InspectionResult | "PASS" | "FAIL" | "CONDITIONAL";

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  checklistItems?: FleetChecklistItemResult[];

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defectsFound?: string[];

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsISO8601()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  followUpNotes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];
}

export class FleetInspectionQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsEnum(FleetInspectionType)
  type?: FleetInspectionType;

  @IsOptional()
  @IsString()
  inspectorId?: string;

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

export class DueInspectionsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  daysAhead?: number;
}

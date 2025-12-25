import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { IncidentSeverity, IncidentType } from "@prisma/client";

export class CreateSafetyIncidentDto {
  @IsNotEmpty()
  @IsEnum(IncidentType)
  type: IncidentType;

  @IsNotEmpty()
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsDateString()
  incidentDate: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  injuries?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  witnesses?: string[];

  @IsOptional()
  @IsBoolean()
  oshaReportable?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

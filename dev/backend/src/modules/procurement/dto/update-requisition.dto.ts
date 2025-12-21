import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Priority, RequisitionType } from "@prisma/client";

export class UpdateRequisitionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequisitionType)
  type?: RequisitionType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  @MinLength(2)
  department?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  siteLocation?: string;

  @IsOptional()
  @IsISO8601()
  requiredDate?: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}

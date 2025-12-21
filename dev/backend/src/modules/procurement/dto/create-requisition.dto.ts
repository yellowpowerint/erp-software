import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { Priority, RequisitionType } from "@prisma/client";
import { AddRequisitionItemDto } from "./add-requisition-item.dto";

export class CreateRequisitionDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RequisitionType)
  type: RequisitionType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsString()
  @MinLength(2)
  department: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  @MinLength(2)
  siteLocation: string;

  @IsISO8601()
  requiredDate: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddRequisitionItemDto)
  items?: AddRequisitionItemDto[];
}

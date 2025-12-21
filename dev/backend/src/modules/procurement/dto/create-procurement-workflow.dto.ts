import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ProcurementApprovalType, RequisitionType, UserRole } from "@prisma/client";

export class CreateProcurementWorkflowStageDto {
  @IsInt()
  @Min(1)
  stageNumber: number;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(UserRole)
  approverRole?: UserRole;

  @IsOptional()
  @IsString()
  approverId?: string;

  @IsOptional()
  @IsEnum(ProcurementApprovalType)
  approvalType?: ProcurementApprovalType;

  @IsOptional()
  @IsInt()
  @Min(1)
  escalationHours?: number;

  @IsOptional()
  @IsString()
  escalateToId?: string;
}

export class CreateProcurementWorkflowDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RequisitionType)
  type?: RequisitionType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  minAmount?: string;

  @IsOptional()
  @IsString()
  maxAmount?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProcurementWorkflowStageDto)
  stages: CreateProcurementWorkflowStageDto[];
}

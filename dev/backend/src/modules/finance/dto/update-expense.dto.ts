import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ApprovalStatus } from "@prisma/client";

export class UpdateExpenseDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;

  @IsOptional()
  @IsUUID()
  approvedById?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

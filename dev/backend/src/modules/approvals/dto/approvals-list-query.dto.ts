import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

const APPROVAL_TYPES = [
  "INVOICE",
  "PURCHASE_REQUEST",
  "IT_REQUEST",
  "PAYMENT_REQUEST",
] as const;

type ApprovalListType = (typeof APPROVAL_TYPES)[number];

const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const;

type ApprovalListStatus = (typeof APPROVAL_STATUSES)[number];

export class ApprovalsListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(APPROVAL_TYPES)
  type?: ApprovalListType;

  @IsOptional()
  @IsIn(APPROVAL_STATUSES)
  status?: ApprovalListStatus;
}

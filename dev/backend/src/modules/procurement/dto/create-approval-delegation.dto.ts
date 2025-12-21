import { IsISO8601, IsOptional, IsString, MinLength } from "class-validator";

export class CreateApprovalDelegationDto {
  @IsString()
  delegatorId: string;

  @IsString()
  delegateId: string;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  reason?: string;
}

import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { LeaveStatus } from "@prisma/client";

export class UpdateLeaveStatusDto {
  @IsNotEmpty()
  @IsEnum(LeaveStatus)
  status: LeaveStatus;

  @IsOptional()
  @IsString()
  @MinLength(2)
  rejectionReason?: string;
}

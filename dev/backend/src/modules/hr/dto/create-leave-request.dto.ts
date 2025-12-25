import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { LeaveType } from "@prisma/client";

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  reason: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

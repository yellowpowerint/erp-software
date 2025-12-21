import { IsOptional, IsString, MinLength } from "class-validator";

export class ApproveRequisitionDto {
  @IsOptional()
  @IsString()
  comments?: string;
}

export class RejectRequisitionDto {
  @IsString()
  @MinLength(2)
  reason: string;
}

export class RequestInfoRequisitionDto {
  @IsString()
  @MinLength(2)
  questions: string;
}

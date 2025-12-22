import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

const RFQ_RESPONSE_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "SELECTED",
  "REJECTED",
] as const;

class RFQResponseEvaluationDto {
  @IsString()
  @MinLength(1)
  responseId: string;

  @IsOptional()
  @IsString()
  technicalScore?: string;

  @IsOptional()
  @IsString()
  commercialScore?: string;

  @IsOptional()
  @IsString()
  overallScore?: string;

  @IsOptional()
  @IsString()
  evaluationNotes?: string;

  @IsOptional()
  @IsIn(RFQ_RESPONSE_STATUSES)
  status?: (typeof RFQ_RESPONSE_STATUSES)[number];
}

export class EvaluateRFQDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RFQResponseEvaluationDto)
  evaluations: RFQResponseEvaluationDto[];
}

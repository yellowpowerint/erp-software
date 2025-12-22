import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class SubmitQualityInspectionDto {
  @IsString()
  @MinLength(2)
  overallResult: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  qualityScore?: number;

  @IsOptional()
  @IsBoolean()
  visualCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  quantityCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  specCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  documentCheck?: boolean;

  @IsOptional()
  @IsBoolean()
  safetyCheck?: boolean;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsArray()
  photos?: string[];
}

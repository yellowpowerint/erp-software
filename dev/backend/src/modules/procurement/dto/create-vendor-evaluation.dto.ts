import { IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class CreateVendorEvaluationDto {
  @IsString()
  @MinLength(2)
  period: string;

  @IsInt()
  @Min(1)
  @Max(5)
  qualityScore: number;

  @IsInt()
  @Min(1)
  @Max(5)
  deliveryScore: number;

  @IsInt()
  @Min(1)
  @Max(5)
  priceScore: number;

  @IsInt()
  @Min(1)
  @Max(5)
  serviceScore: number;

  @IsInt()
  @Min(1)
  @Max(5)
  safetyScore: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  recommendation?: string;
}

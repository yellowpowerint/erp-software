import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";

export class CreateITRequestDto {
  @IsNotEmpty()
  @IsEnum(["EQUIPMENT", "SOFTWARE", "ACCESS", "SUPPORT", "OTHER"])
  requestType: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  justification: string;

  @IsOptional()
  @IsEnum(["LOW", "NORMAL", "HIGH", "URGENT"])
  priority?: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

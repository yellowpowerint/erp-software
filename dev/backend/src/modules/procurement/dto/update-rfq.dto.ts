import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

class UpdateRFQItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  itemName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsString()
  quantity: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsOptional()
  @IsString()
  estimatedPrice?: string;
}

export class UpdateRFQDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requisitionId?: string;

  @IsOptional()
  @IsISO8601()
  responseDeadline?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriod?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  deliveryLocation?: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  specialConditions?: string;

  @IsOptional()
  @IsString()
  siteAccess?: string;

  @IsOptional()
  @IsString()
  safetyRequirements?: string;

  @IsOptional()
  @IsString()
  technicalSpecs?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRFQItemDto)
  items?: UpdateRFQItemDto[];
}

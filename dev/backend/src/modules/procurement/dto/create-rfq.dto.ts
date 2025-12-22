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

class CreateRFQItemDto {
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

export class CreateRFQDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requisitionId?: string;

  @IsISO8601()
  responseDeadline: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityPeriod?: number;

  @IsString()
  @MinLength(2)
  deliveryLocation: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRFQItemDto)
  items: CreateRFQItemDto[];
}

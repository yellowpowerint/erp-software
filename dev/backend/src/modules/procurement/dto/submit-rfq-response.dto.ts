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

class RFQResponseItemDto {
  @IsString()
  @MinLength(1)
  rfqItemId: string;

  @IsString()
  unitPrice: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitRFQResponseDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsISO8601()
  validUntil: string;

  @IsInt()
  @Min(0)
  deliveryDays: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsString()
  quotationDoc?: string;

  @IsOptional()
  @IsString()
  technicalDoc?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RFQResponseItemDto)
  items: RFQResponseItemDto[];
}

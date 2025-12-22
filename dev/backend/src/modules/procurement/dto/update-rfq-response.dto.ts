import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class RFQResponseItemUpdateDto {
  @IsString()
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

export class UpdateRFQResponseDto {
  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryDays?: number;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RFQResponseItemUpdateDto)
  items?: RFQResponseItemUpdateDto[];
}

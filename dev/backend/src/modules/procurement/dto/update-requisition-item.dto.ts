import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Priority } from "@prisma/client";

export class UpdateRequisitionItemDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  itemName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  category?: string;

  @IsOptional()
  @IsNumberString()
  quantity?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  @IsOptional()
  @IsNumberString()
  estimatedPrice?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  preferredVendor?: string;

  @IsOptional()
  @IsString()
  stockItemId?: string;

  @IsOptional()
  @IsEnum(Priority)
  urgency?: Priority;

  @IsOptional()
  @IsString()
  notes?: string;
}

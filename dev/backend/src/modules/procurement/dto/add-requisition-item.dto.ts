import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Priority } from "@prisma/client";

export class AddRequisitionItemDto {
  @IsString()
  @MinLength(2)
  itemName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsNumberString()
  quantity: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsNumberString()
  estimatedPrice: string;

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

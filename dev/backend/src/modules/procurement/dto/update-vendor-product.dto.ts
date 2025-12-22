import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class UpdateVendorProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  productName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  unitPrice?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  minOrderQty?: string;
}

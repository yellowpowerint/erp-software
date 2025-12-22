import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateVendorProductDto {
  @IsString()
  @MinLength(2)
  productName: string;

  @IsString()
  @MinLength(2)
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  unitPrice: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  minOrderQty?: string;
}

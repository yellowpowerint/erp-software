import { Type } from "class-transformer";
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

class UpdateGoodsReceiptItemDto {
  @IsString()
  @MinLength(1)
  poItemId: string;

  @IsString()
  receivedQty: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGoodsReceiptDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  siteLocation?: string;

  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @IsOptional()
  @IsString()
  carrierName?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  driverName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGoodsReceiptItemDto)
  items?: UpdateGoodsReceiptItemDto[];
}

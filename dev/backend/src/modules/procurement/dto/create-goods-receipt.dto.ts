import { Type } from "class-transformer";
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

class CreateGoodsReceiptItemDto {
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

export class CreateGoodsReceiptDto {
  @IsString()
  @MinLength(1)
  purchaseOrderId: string;

  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsString()
  @MinLength(2)
  siteLocation: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGoodsReceiptItemDto)
  items: CreateGoodsReceiptItemDto[];
}

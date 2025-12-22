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

class UpdatePurchaseOrderItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  itemName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  quantity: string;

  @IsString()
  @MinLength(1)
  unit: string;

  @IsString()
  unitPrice: string;

  @IsOptional()
  @IsString()
  stockItemId?: string;
}

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  vendorId?: string;

  @IsOptional()
  @IsString()
  requisitionId?: string;

  @IsOptional()
  @IsString()
  rfqResponseId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  taxAmount?: string;

  @IsOptional()
  @IsString()
  discountAmount?: string;

  @IsOptional()
  @IsString()
  shippingCost?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliverySite?: string;

  @IsOptional()
  @IsISO8601()
  expectedDelivery?: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseOrderItemDto)
  items?: UpdatePurchaseOrderItemDto[];
}

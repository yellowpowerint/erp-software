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

class CreatePurchaseOrderItemDto {
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

export class CreatePurchaseOrderDto {
  @IsString()
  @MinLength(1)
  vendorId: string;

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

  @IsString()
  @MinLength(2)
  deliveryAddress: string;

  @IsOptional()
  @IsString()
  deliverySite?: string;

  @IsISO8601()
  expectedDelivery: string;

  @IsOptional()
  @IsString()
  deliveryTerms?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}

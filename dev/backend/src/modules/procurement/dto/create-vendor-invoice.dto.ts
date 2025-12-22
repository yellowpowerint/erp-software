import { Type } from "class-transformer";
import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";

class CreateVendorInvoiceItemDto {
  @IsString()
  @MinLength(2)
  description: string;

  @IsString()
  quantity: string;

  @IsString()
  unitPrice: string;

  @IsOptional()
  @IsString()
  poItemId?: string;
}

export class CreateVendorInvoiceDto {
  @IsString()
  @MinLength(1)
  invoiceNumber: string;

  @IsString()
  @MinLength(1)
  vendorId: string;

  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  subtotal: string;

  @IsOptional()
  @IsString()
  taxAmount?: string;

  @IsString()
  totalAmount: string;

  @IsISO8601()
  invoiceDate: string;

  @IsISO8601()
  dueDate: string;

  @IsOptional()
  @IsString()
  invoiceDocument?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVendorInvoiceItemDto)
  items: CreateVendorInvoiceItemDto[];
}

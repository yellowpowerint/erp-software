import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

class RejectGoodsReceiptItemDto {
  @IsString()
  goodsReceiptItemId: string;

  @IsString()
  rejectedQty: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectGoodsReceiptDto {
  @IsString()
  @MinLength(2)
  reason: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RejectGoodsReceiptItemDto)
  items?: RejectGoodsReceiptItemDto[];
}

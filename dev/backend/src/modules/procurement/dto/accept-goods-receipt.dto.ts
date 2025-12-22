import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";

class AcceptGoodsReceiptItemDto {
  @IsString()
  goodsReceiptItemId: string;

  @IsString()
  acceptedQty: string;

  @IsString()
  rejectedQty: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AcceptGoodsReceiptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptGoodsReceiptItemDto)
  items: AcceptGoodsReceiptItemDto[];
}

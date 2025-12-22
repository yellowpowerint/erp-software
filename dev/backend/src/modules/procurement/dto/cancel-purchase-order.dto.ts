import { IsOptional, IsString, MinLength } from "class-validator";

export class CancelPurchaseOrderDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  reason?: string;
}

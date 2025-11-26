import {
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from "class-validator";

export class StockMovementDto {
  @IsNotEmpty()
  @IsEnum([
    "STOCK_IN",
    "STOCK_OUT",
    "ADJUSTMENT",
    "TRANSFER",
    "RETURN",
    "DAMAGED",
    "EXPIRED",
  ])
  movementType: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

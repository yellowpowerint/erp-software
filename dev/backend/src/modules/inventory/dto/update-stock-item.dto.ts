import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min } from 'class-validator';

export class UpdateStockItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['CONSUMABLES', 'EQUIPMENT', 'SPARE_PARTS', 'TOOLS', 'FUEL', 'CHEMICALS', 'SAFETY_GEAR', 'OFFICE_SUPPLIES', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsEnum(['PIECES', 'KILOGRAMS', 'LITERS', 'METERS', 'BOXES', 'PALLETS', 'TONS', 'GALLONS', 'UNITS'])
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxStockLevel?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

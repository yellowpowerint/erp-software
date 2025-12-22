import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export enum FleetCostCategory {
  FUEL = "FUEL",
  MAINTENANCE = "MAINTENANCE",
  REPAIRS = "REPAIRS",
  INSURANCE = "INSURANCE",
  REGISTRATION = "REGISTRATION",
  PERMITS = "PERMITS",
  TIRES = "TIRES",
  PARTS = "PARTS",
  LABOR = "LABOR",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  DEPRECIATION = "DEPRECIATION",
  OTHER = "OTHER",
}

export class CreateFleetCostDto {
  @IsString()
  assetId: string;

  @IsISO8601()
  costDate: string;

  @IsEnum(FleetCostCategory)
  category: FleetCostCategory;

  @IsString()
  description: string;

  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  approvedById?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}

export class FleetCostsQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsEnum(FleetCostCategory)
  category?: FleetCostCategory;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class DateRangeQueryDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

export class CompareCostsQueryDto {
  @IsString()
  assetIds: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}

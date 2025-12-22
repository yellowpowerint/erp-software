import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { FuelType } from "./create-fleet-asset.dto";

export enum FuelTransactionType {
  FILL_UP = "FILL_UP",
  PARTIAL_FILL = "PARTIAL_FILL",
  TANK_DISPENSE = "TANK_DISPENSE",
  EXTERNAL = "EXTERNAL",
}

export class CreateFuelRecordDto {
  @IsString()
  assetId: string;

  @IsISO8601()
  transactionDate: string;

  @IsEnum(FuelTransactionType)
  transactionType: FuelTransactionType;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsNumberString()
  quantity: string;

  @IsNumberString()
  unitPrice: string;

  @IsOptional()
  @IsNumberString()
  odometerReading?: string;

  @IsOptional()
  @IsNumberString()
  hoursReading?: string;

  @IsOptional()
  @IsString()
  fuelStation?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsString()
  siteLocation: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receiptImage?: string;

  @IsOptional()
  @IsString()
  approvedById?: string;
}

export class FuelRecordsQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsString()
  siteLocation?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(FuelTransactionType)
  transactionType?: FuelTransactionType;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export enum FuelReportGroupBy {
  ASSET = "ASSET",
  SITE = "SITE",
  FUEL_TYPE = "FUEL_TYPE",
}

export class FuelConsumptionQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  assetIds?: string;

  @IsOptional()
  @IsString()
  siteLocation?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsEnum(FuelReportGroupBy)
  groupBy?: FuelReportGroupBy;
}

export class FuelEfficiencyQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

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

export class FuelAnomaliesQueryDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;
}

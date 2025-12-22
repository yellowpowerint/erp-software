import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export enum FleetAssetType {
  VEHICLE = "VEHICLE",
  HEAVY_MACHINERY = "HEAVY_MACHINERY",
  DRILLING_EQUIPMENT = "DRILLING_EQUIPMENT",
  PROCESSING_EQUIPMENT = "PROCESSING_EQUIPMENT",
  SUPPORT_EQUIPMENT = "SUPPORT_EQUIPMENT",
  TRANSPORT = "TRANSPORT",
}

export enum FuelType {
  DIESEL = "DIESEL",
  PETROL = "PETROL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
  LPG = "LPG",
  NONE = "NONE",
}

export enum FleetAssetStatus {
  ACTIVE = "ACTIVE",
  IN_MAINTENANCE = "IN_MAINTENANCE",
  BREAKDOWN = "BREAKDOWN",
  STANDBY = "STANDBY",
  DECOMMISSIONED = "DECOMMISSIONED",
  SOLD = "SOLD",
}

export enum FleetAssetCondition {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  CRITICAL = "CRITICAL",
}

export class CreateFleetAssetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  assetCode?: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(FleetAssetType)
  type: FleetAssetType;

  @IsString()
  @MinLength(2)
  category: string;

  @IsOptional()
  @IsString()
  registrationNo?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  engineNumber?: string;

  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @IsString()
  @MinLength(1)
  make: string;

  @IsString()
  @MinLength(1)
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsOptional()
  @IsString()
  capacity?: string;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsOptional()
  @IsString()
  tankCapacity?: string;

  @IsOptional()
  @IsISO8601()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  purchasePrice?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsISO8601()
  warrantyExpiry?: string;

  @IsString()
  @MinLength(2)
  currentLocation: string;

  @IsOptional()
  @IsString()
  operatorId?: string;

  @IsOptional()
  @IsString()
  currentOperator?: string;

  @IsOptional()
  @IsString()
  currentOdometer?: string;

  @IsOptional()
  @IsString()
  currentHours?: string;

  @IsOptional()
  @IsString()
  depreciationMethod?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usefulLifeYears?: number;

  @IsOptional()
  @IsString()
  salvageValue?: string;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  insurancePolicyNo?: string;

  @IsOptional()
  @IsISO8601()
  insuranceExpiry?: string;

  @IsOptional()
  @IsString()
  insurancePremium?: string;

  @IsOptional()
  @IsString()
  miningPermit?: string;

  @IsOptional()
  @IsISO8601()
  permitExpiry?: string;

  @IsOptional()
  @IsISO8601()
  safetyInspection?: string;

  @IsOptional()
  @IsISO8601()
  nextInspectionDue?: string;

  @IsOptional()
  @IsString()
  emissionsCert?: string;

  @IsOptional()
  @IsISO8601()
  emissionsExpiry?: string;
}

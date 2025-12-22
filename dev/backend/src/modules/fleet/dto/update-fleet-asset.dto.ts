import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import {
  FleetAssetCondition,
  FleetAssetStatus,
  FleetAssetType,
  FuelType,
} from "./create-fleet-asset.dto";

export class UpdateFleetAssetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(FleetAssetType)
  type?: FleetAssetType;

  @IsOptional()
  @IsString()
  category?: string;

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

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsString()
  capacity?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

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

  @IsOptional()
  @IsEnum(FleetAssetStatus)
  status?: FleetAssetStatus;

  @IsOptional()
  @IsEnum(FleetAssetCondition)
  condition?: FleetAssetCondition;

  @IsOptional()
  @IsString()
  currentLocation?: string;

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

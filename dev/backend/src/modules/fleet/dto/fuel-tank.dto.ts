import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { FuelType } from "./create-fleet-asset.dto";

export enum FuelTankTransactionType {
  REFILL = "REFILL",
  DISPENSE = "DISPENSE",
  ADJUSTMENT = "ADJUSTMENT",
}

export class CreateFuelTankDto {
  @IsString()
  name: string;

  @IsString()
  location: string;

  @IsEnum(FuelType)
  fuelType: FuelType;

  @IsNumberString()
  capacity: string;

  @IsNumberString()
  currentLevel: string;

  @IsNumberString()
  reorderLevel: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateFuelTankDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional()
  @IsNumberString()
  capacity?: string;

  @IsOptional()
  @IsNumberString()
  currentLevel?: string;

  @IsOptional()
  @IsNumberString()
  reorderLevel?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class TankRefillDto {
  @IsNumberString()
  quantity: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TankDispenseDto {
  @IsNumberString()
  quantity: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsNumberString()
  unitPrice?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TankTransactionsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number;
}

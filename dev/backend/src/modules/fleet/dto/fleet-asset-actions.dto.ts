import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { FleetAssetStatus } from "./create-fleet-asset.dto";

export class UpdateFleetAssetStatusDto {
  @IsEnum(FleetAssetStatus)
  status: FleetAssetStatus;
}

export class TransferFleetAssetDto {
  @IsString()
  @MinLength(2)
  newLocation: string;
}

export class AssignFleetOperatorDto {
  @IsString()
  operatorId: string;

  @IsString()
  @MinLength(2)
  siteLocation: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DecommissionFleetAssetDto {
  @IsString()
  @MinLength(2)
  reason: string;
}

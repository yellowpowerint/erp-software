import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import {
  FleetAssetCondition,
  FleetAssetStatus,
  FleetAssetType,
} from "./create-fleet-asset.dto";

export class FleetAssetsQueryDto {
  @IsOptional()
  @IsEnum(FleetAssetType)
  type?: FleetAssetType;

  @IsOptional()
  @IsEnum(FleetAssetStatus)
  status?: FleetAssetStatus;

  @IsOptional()
  @IsEnum(FleetAssetCondition)
  condition?: FleetAssetCondition;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class FleetAssignmentsQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;
}

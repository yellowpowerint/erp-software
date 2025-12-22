import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { FleetAssetType } from "./create-fleet-asset.dto";

export class ChecklistItemDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMaintenanceChecklistDto {
  @IsString()
  assetType: FleetAssetType;

  @IsString()
  name: string;

  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

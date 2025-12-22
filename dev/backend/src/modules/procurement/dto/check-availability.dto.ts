import {
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class AvailabilityItemDto {
  @IsString()
  @IsNotEmpty()
  stockItemId: string;

  @IsOptional()
  @IsNumberString()
  quantity?: string;
}

export class CheckAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityItemDto)
  items: AvailabilityItemDto[];
}

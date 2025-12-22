import { IsBoolean, IsOptional, IsString, MinLength } from "class-validator";

export class VendorStatusActionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;
}

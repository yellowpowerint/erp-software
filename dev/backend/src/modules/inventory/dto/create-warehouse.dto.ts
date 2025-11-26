import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class CreateWarehouseDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

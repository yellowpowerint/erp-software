import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class CreateVendorContactDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

import { IsISO8601, IsOptional, IsString, MinLength } from "class-validator";

export class CreateVendorDocumentDto {
  @IsString()
  @MinLength(2)
  type: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsISO8601()
  expiryDate?: string;
}

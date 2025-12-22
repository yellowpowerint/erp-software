import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";
import { VendorType } from "@prisma/client";

export class CreateVendorDto {
  @IsString()
  @MinLength(2)
  companyName: string;

  @IsOptional()
  @IsString()
  tradingName?: string;

  @IsEnum(VendorType)
  type: VendorType;

  @IsArray()
  @IsString({ each: true })
  category: string[];

  @IsString()
  @MinLength(2)
  primaryContact: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  phone: string;

  @IsOptional()
  @IsString()
  alternatePhone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsString()
  @MinLength(2)
  address: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsString()
  @MinLength(2)
  region: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  gpsCoordinates?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  businessRegNo?: string;

  @IsOptional()
  @IsBoolean()
  vatRegistered?: boolean;

  @ValidateIf((o) => o.vatRegistered === true)
  @IsString()
  @MinLength(2)
  vatNumber?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankBranch?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  swiftCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  paymentTerms?: number;

  @IsOptional()
  @IsString()
  creditLimit?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isPreferred?: boolean;

  @IsOptional()
  @IsString()
  miningLicense?: string;

  @IsOptional()
  @IsString()
  environmentalCert?: string;

  @IsOptional()
  @IsBoolean()
  safetyCompliance?: boolean;

  @IsOptional()
  @IsString()
  insuranceCert?: string;

  @IsOptional()
  @IsISO8601()
  insuranceExpiry?: string;
}

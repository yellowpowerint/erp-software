import { IsISO8601, IsOptional, IsString, MinLength } from "class-validator";

export class RecordVendorPaymentDto {
  @IsString()
  amount: string;

  @IsISO8601()
  paymentDate: string;

  @IsString()
  @MinLength(2)
  paymentMethod: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

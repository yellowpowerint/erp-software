import { IsString, MinLength } from "class-validator";

export class DisputeVendorInvoiceDto {
  @IsString()
  @MinLength(2)
  notes: string;
}

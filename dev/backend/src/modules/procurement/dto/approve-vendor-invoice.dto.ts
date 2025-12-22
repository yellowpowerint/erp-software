import { IsOptional, IsString } from "class-validator";

export class ApproveVendorInvoiceDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

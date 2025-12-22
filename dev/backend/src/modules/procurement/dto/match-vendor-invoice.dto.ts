import { IsInt, IsOptional, Max, Min } from "class-validator";

export class MatchVendorInvoiceDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  tolerancePercent?: number;
}

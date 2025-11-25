import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  supplierName: string;

  @IsOptional()
  @IsString()
  supplierEmail?: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsNotEmpty()
  @IsEnum(['VOUCHER', 'REIMBURSEMENT', 'ADVANCE', 'PETTY_CASH'])
  paymentType: string;

  @IsNotEmpty()
  @IsString()
  payeeName: string;

  @IsOptional()
  @IsString()
  payeeAccount?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

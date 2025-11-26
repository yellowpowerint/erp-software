import { IsString, IsNumber, IsOptional, IsInt, Min } from "class-validator";

export class CreatePurchaseRequestDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  estimatedCost: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  justification: string;

  @IsOptional()
  @IsString()
  urgency?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  supplierSuggestion?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

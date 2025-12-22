import { IsISO8601, IsOptional, IsString, MinLength } from "class-validator";

export class UploadFleetDocumentDto {
  @IsString()
  @MinLength(2)
  type: string;

  @IsOptional()
  @IsISO8601()
  expiryDate?: string;
}

export class GetExpiringDocumentsDto {
  @IsOptional()
  @IsString()
  daysAhead?: string;
}

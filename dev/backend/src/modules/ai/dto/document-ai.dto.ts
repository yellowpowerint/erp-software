import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import { DocumentCategory } from "@prisma/client";

export class SmartSearchDto {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class DetectDuplicatesDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  fileHash?: string;
}

export class DocumentQaDto {
  @IsString()
  @IsNotEmpty()
  question!: string;
}

export class SmartSearchResultDto {
  @IsString()
  id!: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  score!: number;
}

export class AnalyzeOptionsDto {
  @IsOptional()
  force?: boolean;
}

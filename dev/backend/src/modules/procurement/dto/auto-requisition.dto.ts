import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class AutoRequisitionDto {
  @IsString()
  stockItemId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

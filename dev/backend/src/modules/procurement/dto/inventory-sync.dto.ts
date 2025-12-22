import { IsInt, IsOptional, Max, Min } from "class-validator";

export class InventorySyncDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

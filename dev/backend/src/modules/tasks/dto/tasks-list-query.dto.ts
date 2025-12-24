import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
type TaskStatusQuery = (typeof TASK_STATUSES)[number];

export class TasksListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatusQuery;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      if (v === "true" || v === "1" || v === "yes" || v === "y") return true;
      if (v === "false" || v === "0" || v === "no" || v === "n") return false;
    }
    return undefined;
  })
  @IsBoolean()
  mine?: boolean;
}

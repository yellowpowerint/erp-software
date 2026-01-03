import { IsIn, IsNotEmpty } from "class-validator";

const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "CANCELLED"] as const;
type TaskStatusDto = (typeof TASK_STATUSES)[number];

export class UpdateTaskStatusDto {
  @IsNotEmpty()
  @IsIn(TASK_STATUSES)
  status: TaskStatusDto;
}
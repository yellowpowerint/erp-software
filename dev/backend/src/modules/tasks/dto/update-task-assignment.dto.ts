import { IsNotEmpty, IsString } from "class-validator";

export class UpdateTaskAssignmentDto {
  @IsNotEmpty()
  @IsString()
  assignedToId: string;
}
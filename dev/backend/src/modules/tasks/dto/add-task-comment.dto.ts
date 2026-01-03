import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AddTaskCommentDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000)
  content: string;
}
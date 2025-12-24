import { IsString, MinLength } from "class-validator";

export class RejectionActionDto {
  @IsString()
  @MinLength(2)
  comments!: string;
}

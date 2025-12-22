import { IsString, MinLength } from "class-validator";

export class AwardRFQDto {
  @IsString()
  @MinLength(1)
  responseId: string;
}

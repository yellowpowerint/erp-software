import { IsString, MinLength } from "class-validator";

export class CancelRequisitionDto {
  @IsString()
  @MinLength(2)
  reason: string;
}

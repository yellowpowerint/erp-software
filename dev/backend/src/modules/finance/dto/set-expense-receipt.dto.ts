import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SetExpenseReceiptDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  receiptUrl: string;
}

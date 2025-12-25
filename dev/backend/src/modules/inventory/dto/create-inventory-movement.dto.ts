import { IsNotEmpty, IsString } from "class-validator";
import { StockMovementDto } from "./stock-movement.dto";

export class CreateInventoryMovementDto extends StockMovementDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;
}

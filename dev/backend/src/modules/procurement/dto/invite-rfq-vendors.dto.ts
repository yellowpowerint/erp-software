import { IsArray, IsString } from "class-validator";

export class InviteRFQVendorsDto {
  @IsArray()
  @IsString({ each: true })
  vendorIds: string[];
}

import { IsString, MinLength } from "class-validator";

export class UnregisterMobileDeviceDto {
  @IsString()
  @MinLength(1)
  deviceId: string;
}

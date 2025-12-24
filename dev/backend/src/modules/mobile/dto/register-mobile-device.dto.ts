import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterMobileDeviceDto {
  @IsString()
  @MinLength(1)
  deviceId: string;

  @IsString()
  @IsIn(["ios", "android"], { message: "platform must be ios or android" })
  platform: string;

  @IsString()
  @MinLength(1)
  pushToken: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;
}

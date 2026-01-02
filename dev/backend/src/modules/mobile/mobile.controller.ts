import { Body, Controller, Get, Post } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { MobileService } from "./mobile.service";
import { RegisterMobileDeviceDto } from "./dto/register-mobile-device.dto";
import { UnregisterMobileDeviceDto } from "./dto/unregister-mobile-device.dto";

@Controller("mobile")
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Public()
  @Get("config")
  async getConfig() {
    return this.mobileService.getMobileConfig();
  }

  @Get("capabilities")
  async getUserCapabilities(@CurrentUser() user: any) {
    return this.mobileService.getUserCapabilities(user);
  }

  @Post("devices/register")
  async registerDevice(@CurrentUser() user: any, @Body() dto: RegisterMobileDeviceDto) {
    return this.mobileService.registerDevice(user.userId, {
      deviceId: dto.deviceId,
      platform: dto.platform,
      pushToken: dto.pushToken,
      appVersion: dto.appVersion,
      deviceModel: dto.deviceModel,
      osVersion: dto.osVersion,
    });
  }

  @Post("devices/unregister")
  async unregisterDevice(@CurrentUser() user: any, @Body() dto: UnregisterMobileDeviceDto) {
    return this.mobileService.unregisterDevice(user.userId, dto.deviceId);
  }
}

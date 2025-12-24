import { Controller, Get } from "@nestjs/common";
import { Public } from "@/common/decorators/public.decorator";
import { MobileService } from "./mobile.service";

@Controller("mobile")
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Public()
  @Get("config")
  async getConfig() {
    return this.mobileService.getMobileConfig();
  }
}

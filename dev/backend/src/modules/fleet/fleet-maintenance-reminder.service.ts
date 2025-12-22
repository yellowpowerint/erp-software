import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FleetMaintenanceService } from "./fleet-maintenance.service";

@Injectable()
export class FleetMaintenanceReminderService
  implements OnModuleInit, OnModuleDestroy
{
  private timer: NodeJS.Timeout | null = null;
  private lastRunAt: number | null = null;
  private running = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly maintenanceService: FleetMaintenanceService,
  ) {}

  async onModuleInit() {
    const enabled =
      this.configService.get<string>(
        "FLEET_MAINTENANCE_REMINDERS_ENABLED",
        "true",
      ) === "true";
    if (!enabled) return;

    this.timer = setInterval(() => {
      this.tick().catch(() => undefined);
    }, 300_000);
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    if (this.running) return;
    this.running = true;

    try {
      const now = Date.now();
      if (this.lastRunAt && now - this.lastRunAt < 3_600_000) {
        return;
      }

      await this.maintenanceService.sendMaintenanceReminders();
      this.lastRunAt = now;
    } finally {
      this.running = false;
    }
  }
}

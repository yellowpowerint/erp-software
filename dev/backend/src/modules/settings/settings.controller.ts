import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("settings")
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // System Configuration
  @Get("config")
  async getSystemConfig() {
    return this.settingsService.getSystemConfig();
  }

  @Put("config")
  async updateSystemConfig(@Body() data: any) {
    return this.settingsService.updateSystemConfig(data);
  }

  // AI Provider Settings (BYOK)
  @Get("ai")
  async getAiSettings() {
    return this.settingsService.getAiSettings();
  }

  @Put("ai")
  async updateAiSettings(@Body() data: any) {
    return this.settingsService.updateAiSettings(data);
  }

  // System Statistics
  @Get("stats")
  async getSystemStats() {
    return this.settingsService.getSystemStats();
  }

  @Get("dashboard-overview")
  async getDashboardOverview() {
    return this.settingsService.getDashboardOverview();
  }

  // User Management
  @Get("users")
  async getAllUsers(
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.settingsService.getAllUsers({ role, status, search });
  }

  @Get("users/:id")
  async getUserById(@Param("id") id: string) {
    return this.settingsService.getUserById(id);
  }

  @Post("users")
  async createUser(@Body() data: any) {
    return this.settingsService.createUser(data);
  }

  @Put("users/:id")
  async updateUser(@Param("id") id: string, @Body() data: any) {
    return this.settingsService.updateUser(id, data);
  }

  @Post("users/:id/deactivate")
  async deactivateUser(@Param("id") id: string) {
    return this.settingsService.deactivateUser(id);
  }

  @Post("users/:id/activate")
  async activateUser(@Param("id") id: string) {
    return this.settingsService.activateUser(id);
  }

  @Post("users/:id/reset-password")
  async resetUserPassword(
    @Param("id") id: string,
    @Body() data: { newPassword: string },
  ) {
    return this.settingsService.resetUserPassword(id, data.newPassword);
  }

  @Post("change-password")
  async changePassword(
    @Body()
    data: {
      userId: string;
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.settingsService.changePassword(
      data.userId,
      data.currentPassword,
      data.newPassword,
    );
  }

  // Audit Logs
  @Get("audit-logs")
  async getAuditLogs(@Query("limit") limit?: string) {
    return this.settingsService.getAuditLogs(limit ? parseInt(limit) : 50);
  }
}

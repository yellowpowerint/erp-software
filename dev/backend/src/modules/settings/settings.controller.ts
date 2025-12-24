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
import { UserRole } from "@prisma/client";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsers(
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    return this.settingsService.getAllUsers({ role, status, search });
  }

  @Get("users/:id")
  @Roles(UserRole.SUPER_ADMIN)
  async getUserById(@Param("id") id: string) {
    return this.settingsService.getUserById(id);
  }

  @Post("users")
  @Roles(UserRole.SUPER_ADMIN)
  async createUser(@Body() data: any) {
    return this.settingsService.createUser(data);
  }

  @Put("users/:id")
  @Roles(UserRole.SUPER_ADMIN)
  async updateUser(@Param("id") id: string, @Body() data: any) {
    return this.settingsService.updateUser(id, data);
  }

  @Post("users/:id/deactivate")
  @Roles(UserRole.SUPER_ADMIN)
  async deactivateUser(@Param("id") id: string) {
    return this.settingsService.deactivateUser(id);
  }

  @Post("users/:id/activate")
  @Roles(UserRole.SUPER_ADMIN)
  async activateUser(@Param("id") id: string) {
    return this.settingsService.activateUser(id);
  }

  @Post("users/:id/reset-password")
  @Roles(UserRole.SUPER_ADMIN)
  async resetUserPassword(
    @Param("id") id: string,
    @Body() data: { newPassword: string },
  ) {
    return this.settingsService.resetUserPassword(id, data.newPassword);
  }

  @Post("change-password")
  async changePassword(
    @CurrentUser() user: any,
    @Body()
    data: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    return this.settingsService.changePassword(
      user.userId,
      data.currentPassword,
      data.newPassword,
    );
  }

  // Audit Logs
  @Get("audit-logs")
  @Roles(UserRole.SUPER_ADMIN)
  async getAuditLogs(@Query("limit") limit?: string) {
    return this.settingsService.getAuditLogs(limit ? parseInt(limit) : 50);
  }
}

import { Controller, Get, Query } from "@nestjs/common";
import { ReportsService } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("dashboard")
  getDashboardAnalytics() {
    return this.reportsService.getDashboardAnalytics();
  }

  @Get("financial/summary")
  getFinancialSummary(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getFinancialSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get("financial/budget-analysis")
  getBudgetAnalysis() {
    return this.reportsService.getBudgetAnalysis();
  }

  @Get("operational/inventory")
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Get("operational/assets")
  getAssetReport() {
    return this.reportsService.getAssetReport();
  }

  @Get("operational/projects")
  getProjectReport(@Query("status") status?: string) {
    return this.reportsService.getProjectReport(status);
  }

  @Get("hr")
  getHRReport() {
    return this.reportsService.getHRReport();
  }

  @Get("safety")
  getSafetyReport(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.reportsService.getSafetyReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

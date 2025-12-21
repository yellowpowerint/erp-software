import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ApprovalsModule } from "./modules/approvals/approvals.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { OperationsModule } from "./modules/operations/operations.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { AiModule } from "./modules/ai/ai.module";
import { HrModule } from "./modules/hr/hr.module";
import { SafetyModule } from "./modules/safety/safety.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { CsvModule } from "./modules/csv/csv.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApprovalsModule,
    NotificationsModule,
    InventoryModule,
    AssetsModule,
    ProjectsModule,
    OperationsModule,
    FinanceModule,
    AiModule,
    HrModule,
    SafetyModule,
    ReportsModule,
    SettingsModule,
    DocumentsModule,
    CsvModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

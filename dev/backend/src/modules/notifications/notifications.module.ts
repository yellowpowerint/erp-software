import { Module, forwardRef } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CsvModule } from "../csv/csv.module";

@Module({
  imports: [forwardRef(() => CsvModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

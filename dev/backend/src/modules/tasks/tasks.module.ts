import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StorageService } from "../documents/services/storage.service";

@Module({
  controllers: [TasksController],
  providers: [TasksService, PrismaService, StorageService],
  exports: [TasksService],
})
export class TasksModule {}

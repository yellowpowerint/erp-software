import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { InventoryReportsController } from './reports.controller';
import { InventoryReportsService } from './reports.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [InventoryController, WarehousesController, InventoryReportsController],
  providers: [InventoryService, WarehousesService, InventoryReportsService, PrismaService],
  exports: [InventoryService, WarehousesService, InventoryReportsService],
})
export class InventoryModule {}

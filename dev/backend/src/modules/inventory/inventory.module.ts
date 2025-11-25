import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  controllers: [InventoryController, WarehousesController],
  providers: [InventoryService, WarehousesService, PrismaService],
  exports: [InventoryService, WarehousesService],
})
export class InventoryModule {}

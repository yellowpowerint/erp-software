-- CreateEnum: Stock Units
DO $$ BEGIN
    CREATE TYPE "StockUnit" AS ENUM ('PIECES', 'KILOGRAMS', 'LITERS', 'METERS', 'BOXES', 'PALLETS', 'TONS', 'GALLONS', 'UNITS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Stock Categories
DO $$ BEGIN
    CREATE TYPE "StockCategory" AS ENUM ('CONSUMABLES', 'EQUIPMENT', 'SPARE_PARTS', 'TOOLS', 'FUEL', 'CHEMICALS', 'SAFETY_GEAR', 'OFFICE_SUPPLIES', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: Movement Types
DO $$ BEGIN
    CREATE TYPE "MovementType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'TRANSFER', 'RETURN', 'DAMAGED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: Warehouses
CREATE TABLE IF NOT EXISTS "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Stock Items
CREATE TABLE IF NOT EXISTS "stock_items" (
    "id" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "StockCategory" NOT NULL,
    "unit" "StockUnit" NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "maxStockLevel" INTEGER,
    "warehouseId" TEXT NOT NULL,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "barcode" TEXT,
    "supplier" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Stock Movements
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "reference" TEXT,
    "notes" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "warehouses_code_key" ON "warehouses"("code");
CREATE INDEX IF NOT EXISTS "warehouses_isActive_idx" ON "warehouses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "stock_items_itemCode_key" ON "stock_items"("itemCode");
CREATE INDEX IF NOT EXISTS "stock_items_category_idx" ON "stock_items"("category");
CREATE INDEX IF NOT EXISTS "stock_items_warehouseId_idx" ON "stock_items"("warehouseId");
CREATE INDEX IF NOT EXISTS "stock_items_currentQuantity_idx" ON "stock_items"("currentQuantity");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_movements_itemId_idx" ON "stock_movements"("itemId");
CREATE INDEX IF NOT EXISTS "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");
CREATE INDEX IF NOT EXISTS "stock_movements_movementType_idx" ON "stock_movements"("movementType");
CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_items_warehouseId_fkey') THEN
        ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_items')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_itemId_fkey') THEN
        ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'warehouses')
      AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_movements_warehouseId_fkey') THEN
        ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

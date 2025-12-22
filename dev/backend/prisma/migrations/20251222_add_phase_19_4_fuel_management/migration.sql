DO $$ BEGIN
  CREATE TYPE "FuelTransactionType" AS ENUM (
    'FILL_UP',
    'PARTIAL_FILL',
    'TANK_DISPENSE',
    'EXTERNAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FuelTankTransactionType" AS ENUM (
    'REFILL',
    'DISPENSE',
    'ADJUSTMENT'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "fuel_records" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,

  "transactionDate" TIMESTAMP(3) NOT NULL,
  "transactionType" "FuelTransactionType" NOT NULL,

  "fuelType" "FuelType" NOT NULL,
  "quantity" DECIMAL(10,2) NOT NULL,
  "unitPrice" DECIMAL(10,4) NOT NULL,
  "totalCost" DECIMAL(15,2) NOT NULL,

  "odometerReading" DECIMAL(12,2),
  "hoursReading" DECIMAL(12,2),

  "distanceSinceLast" DECIMAL(10,2),
  "hoursSinceLast" DECIMAL(10,2),
  "fuelEfficiency" DECIMAL(10,4),

  "fuelStation" TEXT,
  "receiptNumber" TEXT,

  "siteLocation" TEXT NOT NULL,

  "filledById" TEXT NOT NULL,
  "approvedById" TEXT,

  "notes" TEXT,
  "receiptImage" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fuel_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fuel_tanks" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "fuelType" "FuelType" NOT NULL,
  "capacity" DECIMAL(12,2) NOT NULL,
  "currentLevel" DECIMAL(12,2) NOT NULL,
  "reorderLevel" DECIMAL(12,2) NOT NULL,
  "lastRefillDate" TIMESTAMP(3),
  "lastRefillQty" DECIMAL(12,2),
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "fuel_tanks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "fuel_tank_transactions" (
  "id" TEXT NOT NULL,
  "tankId" TEXT NOT NULL,
  "transactionType" "FuelTankTransactionType" NOT NULL,
  "quantity" DECIMAL(12,2) NOT NULL,
  "balanceBefore" DECIMAL(12,2) NOT NULL,
  "balanceAfter" DECIMAL(12,2) NOT NULL,
  "assetId" TEXT,
  "reference" TEXT,
  "performedById" TEXT NOT NULL,
  "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,

  CONSTRAINT "fuel_tank_transactions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_filledById_fkey" FOREIGN KEY ("filledById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fuel_records" ADD CONSTRAINT "fuel_records_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fuel_tank_transactions" ADD CONSTRAINT "fuel_tank_transactions_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "fuel_tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fuel_tank_transactions" ADD CONSTRAINT "fuel_tank_transactions_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fuel_tank_transactions" ADD CONSTRAINT "fuel_tank_transactions_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_records_assetId_idx" ON "fuel_records"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_records_transactionDate_idx" ON "fuel_records"("transactionDate");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_records_siteLocation_idx" ON "fuel_records"("siteLocation");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_records_fuelType_idx" ON "fuel_records"("fuelType");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_tanks_location_idx" ON "fuel_tanks"("location");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_tanks_fuelType_idx" ON "fuel_tanks"("fuelType");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_tanks_status_idx" ON "fuel_tanks"("status");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_tank_transactions_tankId_idx" ON "fuel_tank_transactions"("tankId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_tank_transactions_transactionDate_idx" ON "fuel_tank_transactions"("transactionDate");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fuel_tank_transactions_transactionType_idx" ON "fuel_tank_transactions"("transactionType");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

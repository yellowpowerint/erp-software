DO $$ BEGIN
  CREATE TYPE "FleetCostCategory" AS ENUM (
    'FUEL',
    'MAINTENANCE',
    'REPAIRS',
    'INSURANCE',
    'REGISTRATION',
    'PERMITS',
    'TIRES',
    'PARTS',
    'LABOR',
    'EXTERNAL_SERVICE',
    'DEPRECIATION',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "fleet_costs" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,

  "costDate" TIMESTAMP(3) NOT NULL,
  "category" "FleetCostCategory" NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(15,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GHS',

  "referenceType" TEXT,
  "referenceId" TEXT,

  "approvedById" TEXT,

  "invoiceNumber" TEXT,
  "receiptUrl" TEXT,

  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fleet_costs_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "fleet_costs" ADD CONSTRAINT "fleet_costs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "fleet_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_costs" ADD CONSTRAINT "fleet_costs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "fleet_costs" ADD CONSTRAINT "fleet_costs_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_costs_assetId_idx" ON "fleet_costs"("assetId");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_costs_category_idx" ON "fleet_costs"("category");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "fleet_costs_costDate_idx" ON "fleet_costs"("costDate");
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

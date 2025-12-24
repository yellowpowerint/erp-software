-- Add mobile device registration table for push notifications

CREATE TABLE IF NOT EXISTS "mobile_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "pushToken" TEXT NOT NULL,
    "appVersion" TEXT,
    "deviceModel" TEXT,
    "osVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mobile_devices_userId_fkey'
  ) THEN
    ALTER TABLE "mobile_devices"
      ADD CONSTRAINT "mobile_devices_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS "mobile_devices_userId_deviceId_key" ON "mobile_devices"("userId", "deviceId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "mobile_devices_userId_idx" ON "mobile_devices"("userId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "mobile_devices_pushToken_idx" ON "mobile_devices"("pushToken");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "mobile_devices_lastSeenAt_idx" ON "mobile_devices"("lastSeenAt");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

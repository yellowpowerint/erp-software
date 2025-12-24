-- Add user reporting line + module permissions + force password change

ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "managerId" TEXT,
  ADD COLUMN IF NOT EXISTS "modulePermissions" JSONB,
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_managerId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_managerId_fkey"
      FOREIGN KEY ("managerId") REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "users_managerId_idx" ON "users"("managerId");

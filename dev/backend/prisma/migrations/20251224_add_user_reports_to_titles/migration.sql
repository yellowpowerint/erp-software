-- Add multi-reporting line titles for user management wizard

ALTER TABLE IF EXISTS "users"
  ADD COLUMN IF NOT EXISTS "reportsToTitles" JSONB;

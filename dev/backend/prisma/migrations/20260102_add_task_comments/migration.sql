-- Add CANCELLED to TaskStatus enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'TaskStatus'
      AND e.enumlabel = 'CANCELLED'
  ) THEN
    ALTER TYPE "TaskStatus" ADD VALUE 'CANCELLED';
  END IF;
END $$;

-- Create task comments table
CREATE TABLE IF NOT EXISTS "task_comments" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_comments_taskId_fkey'
  ) THEN
    ALTER TABLE "task_comments"
      ADD CONSTRAINT "task_comments_taskId_fkey"
      FOREIGN KEY ("taskId") REFERENCES "tasks"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_comments_authorId_fkey'
  ) THEN
    ALTER TABLE "task_comments"
      ADD CONSTRAINT "task_comments_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "task_comments_taskId_idx" ON "task_comments"("taskId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS "task_comments_authorId_idx" ON "task_comments"("authorId");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;
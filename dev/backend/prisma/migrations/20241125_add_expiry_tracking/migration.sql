-- Add expiry date tracking to stock items (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_items') THEN
        ALTER TABLE "stock_items" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);
        ALTER TABLE "stock_items" ADD COLUMN IF NOT EXISTS "lastRestockDate" TIMESTAMP(3);
        
        -- Add index for expiry date queries
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'stock_items_expiryDate_idx') THEN
            CREATE INDEX "stock_items_expiryDate_idx" ON "stock_items"("expiryDate");
        END IF;
    END IF;
END $$;

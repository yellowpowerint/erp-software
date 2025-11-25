-- Add expiry date tracking to stock items
ALTER TABLE "stock_items" ADD COLUMN "expiryDate" TIMESTAMP(3);
ALTER TABLE "stock_items" ADD COLUMN "lastRestockDate" TIMESTAMP(3);

-- Add index for expiry date queries
CREATE INDEX "stock_items_expiryDate_idx" ON "stock_items"("expiryDate");

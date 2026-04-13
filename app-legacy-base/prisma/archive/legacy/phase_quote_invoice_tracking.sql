ALTER TABLE "quotes"
ADD COLUMN IF NOT EXISTS "invoice_issued_at" DATE;

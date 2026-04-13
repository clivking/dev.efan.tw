ALTER TABLE uploaded_files
ADD COLUMN IF NOT EXISTS display_mode VARCHAR(20) NOT NULL DEFAULT 'contain';

UPDATE uploaded_files
SET display_mode = 'contain'
WHERE display_mode IS NULL;

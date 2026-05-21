-- Add missing access_code column to staff table
-- Run this in your Supabase SQL Editor

ALTER TABLE staff ADD COLUMN IF NOT EXISTS access_code VARCHAR(4);

-- Verification query
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

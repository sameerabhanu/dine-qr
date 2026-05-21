-- Fix staff table constraints for access code authentication
-- Run this in your Supabase SQL Editor

-- Make email nullable (since we use access_code for authentication)
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;

-- Make password_hash nullable (since we use access_code for authentication)
ALTER TABLE staff ALTER COLUMN password_hash DROP NOT NULL;

-- Verification query
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY ordinal_position;

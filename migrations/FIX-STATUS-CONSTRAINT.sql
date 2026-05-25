-- ============================================
-- FIX: Update orders status constraint
-- Run this in your Supabase SQL Editor to fix the constraint
-- ============================================

-- Drop the old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the correct constraint with all valid statuses
-- pending: New order from customer
-- claimed: Waiter accepted the order
-- preparing: Kitchen is preparing (optional)
-- ready: Food is ready (optional)
-- served: Waiter served to table
-- completed: Order completed and payment done
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'claimed', 'preparing', 'ready', 'served', 'completed'));

-- Verify the fix
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass 
AND conname = 'orders_status_check';

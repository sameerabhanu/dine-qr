-- ============================================
-- Add 'payment_collected' status to orders table
-- Date: May 30, 2026
-- ============================================
-- This migration adds a new status 'payment_collected' to the orders table.
-- This status is used when a waiter marks payment as collected, waiting for admin confirmation.

-- Drop the existing CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new CHECK constraint with 'payment_collected' status
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'claimed', 'preparing', 'ready', 'served', 'completed', 'payment_collected'));

-- ============================================
-- Migration Complete ✅
-- ============================================

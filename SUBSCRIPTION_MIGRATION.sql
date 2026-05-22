-- ==========================================
-- DINEQR SUBSCRIPTION MANAGEMENT SYSTEM
-- SQL Migration Script
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Add subscription management fields to restaurants table
-- ================================================================
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;

-- Add comment for subscription_status values
COMMENT ON COLUMN restaurants.subscription_status IS 'Possible values: active, expiring_soon, expired, suspended, inactive';

-- Step 2: Create indexes for faster subscription queries
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_expires_at ON restaurants(subscription_expires_at);

-- Step 3: Initialize existing restaurants with default expiry (30 days from now)
-- ===============================================================================
UPDATE restaurants 
SET subscription_expires_at = NOW() + INTERVAL '30 days',
    subscription_status = 'active'
WHERE subscription_expires_at IS NULL;

-- Step 4: Create demo_requests table (for new restaurant requests)
-- ==================================================================
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, contacted, approved, rejected
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for demo requests
CREATE INDEX IF NOT EXISTS idx_demo_requests_status ON demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at DESC);

-- ==========================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked
-- ==========================================

-- Check if all columns were added successfully
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND column_name IN (
  'subscription_status', 
  'subscription_expires_at', 
  'grace_period_days',
  'suspended_at',
  'suspension_reason',
  'last_payment_amount',
  'last_payment_date'
);

-- Check current restaurant subscription statuses
SELECT 
  name,
  subscription_status,
  subscription_expires_at,
  grace_period_days,
  last_payment_date
FROM restaurants
ORDER BY subscription_expires_at ASC NULLS LAST;

-- Check if demo_requests table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'demo_requests';

-- ==========================================
-- SUCCESS!
-- If all queries above return results, 
-- the migration was successful.
-- ==========================================

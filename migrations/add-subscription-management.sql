-- Add subscription management fields to restaurants table
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

-- Create index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_expires_at ON restaurants(subscription_expires_at);

-- Update existing restaurants to have a default expiry date (1 month from now)
UPDATE restaurants 
SET subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE subscription_expires_at IS NULL;

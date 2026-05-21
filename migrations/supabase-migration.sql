-- Complete schema update for Supabase migration
-- Run this after the base schema (0000_spooky_dracula.sql)

-- 1. Remove description columns
ALTER TABLE categories DROP COLUMN IF EXISTS description;
ALTER TABLE menu_items DROP COLUMN IF EXISTS description;

-- 2. Update menu_items table for food type system
ALTER TABLE menu_items DROP COLUMN IF EXISTS image_url;
ALTER TABLE menu_items DROP COLUMN IF EXISTS customizations;
ALTER TABLE menu_items DROP COLUMN IF EXISTS is_veg;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS food_type VARCHAR(20) DEFAULT 'veg' NOT NULL;

-- 3. Add waiter support to orders table
ALTER TABLE orders DROP COLUMN IF EXISTS accepted_at;
ALTER TABLE orders DROP COLUMN IF EXISTS preparing_at;
ALTER TABLE orders DROP COLUMN IF EXISTS ready_at;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES staff(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- 4. Add payment tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- 5. Enable Row Level Security (required for Supabase Realtime)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (allowing service role full access)
CREATE POLICY "Enable all access for service role" ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON order_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Enable Realtime for orders and order_items tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Verification queries (uncomment to check)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'menu_items' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position;

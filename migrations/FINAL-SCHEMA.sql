-- ============================================
-- DINEQR - COMPLETE DATABASE SCHEMA
-- Digital Ordering System - Reseller/Franchise Model
-- Version: 2026 (Production Ready)
-- ============================================
-- 
-- This schema includes:
-- - Simplified restaurant/staff/menu/orders structure
-- - Order count tracking (no subscriptions)
-- - Digital ordering fee model
-- - Supabase Realtime enabled
-- - RLS disabled for internal app access
-- - Daily & monthly counter rollover via cron jobs
-- ============================================
--
-- AUTOMATED CRON JOBS (configured in vercel.json):
-- 1. Daily Reset (00:00): Resets today_orders_count to 0
-- 2. Monthly Report (1st at 00:00): Rolls over counters + sends emails
-- ============================================

-- ============================================
-- CLEANUP: Drop all existing tables
-- ============================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS demo_requests CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;

-- ============================================
-- SUPER ADMINS TABLE
-- ============================================
CREATE TABLE super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP
);

-- ============================================
-- RESTAURANTS TABLE
-- ============================================
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    access_code TEXT NOT NULL, -- 4-digit code for admin login
    
    -- Order count tracking (for billing/reporting)
    today_orders_count INTEGER DEFAULT 0,
    current_month_orders_count INTEGER DEFAULT 0,
    last_month_orders_count INTEGER DEFAULT 0,
    
    -- Agency info (for monthly reports to super admin)
    agency_name TEXT DEFAULT 'DineQR',
    agency_location TEXT DEFAULT 'India',
    agency_contact TEXT DEFAULT '+91-8333027544'
);

-- ============================================
-- STAFF TABLE (Admins & Waiters)
-- ============================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'waiter', -- 'admin' or 'waiter'
    access_code TEXT NOT NULL, -- 4-digit PIN for login
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP
);

-- ============================================
-- TABLES TABLE
-- ============================================
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    qr_code TEXT UNIQUE NOT NULL, -- QR code identifier
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    food_type TEXT CHECK (food_type IN ('veg', 'non-veg', 'egg')) DEFAULT 'veg',
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0
);

-- ============================================
-- ORDERS TABLE
-- Orders with 'payment_collected' status await admin confirmation
-- Orders are deleted after admin confirms payment
-- Only counts are tracked for billing
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Order details
    table_number INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'preparing', 'ready', 'served', 'completed', 'payment_collected')),
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Digital ordering fee (configurable)
    ordering_fee DECIMAL(10, 2) DEFAULT 7.00,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    
    -- Snapshot data (preserved even if menu item is deleted)
    menu_item_name TEXT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- DEMO REQUESTS TABLE
-- ============================================
CREATE TABLE demo_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected'))
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Restaurant lookups
CREATE INDEX idx_restaurants_slug ON restaurants(slug);

-- Staff lookups
CREATE INDEX idx_staff_restaurant_id ON staff(restaurant_id);
CREATE INDEX idx_staff_access_code ON staff(access_code);

-- Table lookups
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_tables_qr_code ON tables(qr_code);

-- Menu lookups
CREATE INDEX idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);

-- Order lookups (critical for performance)
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_waiter_id ON orders(waiter_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- DISABLE ROW LEVEL SECURITY (RLS)
-- Required for Supabase Realtime to work
-- ============================================
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_requests DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ENABLE SUPABASE REALTIME
-- For real-time order updates
-- ============================================
-- Note: After running this SQL, you must also enable realtime in Supabase Dashboard:
-- 1. Go to Database > Replication
-- 2. Find 'supabase_realtime' publication
-- 3. Enable: orders, order_items, tables, staff
-- 
-- Or run these commands:
-- ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tables;
-- ALTER PUBLICATION supabase_realtime ADD TABLE staff;

-- ============================================
-- SEED DATA: Default Super Admin
-- ============================================
-- Email: admin@dineqr.com
-- Password: admin123
-- IMPORTANT: Change password after first login!
INSERT INTO super_admins (name, email, password_hash, is_active)
VALUES (
    'Super Admin',
    'admin@dineqr.com',
    '$2a$10$YQs0Yn5xGzFQw8jq6vF7KeYrD6kX5xZrJ6kL3GpJQvqZ8qL5qL6qm', -- admin123
    true
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the schema:
/*
-- Check all tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check super admins
SELECT id, name, email, is_active FROM super_admins;

-- Check RLS status (should all be false)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check realtime publication (run in SQL editor or dashboard)
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
*/

-- ============================================
-- POST-INSTALLATION CHECKLIST
-- ============================================
-- [ ] 1. Run this SQL in Supabase SQL Editor
-- [ ] 2. Verify super admin login: admin@dineqr.com / admin123
-- [ ] 3. Enable Realtime in Dashboard > Database > Replication
-- [ ] 4. Change super admin password after first login
-- [ ] 5. Test: Create restaurant, add menu, place order
-- [ ] 6. Verify: Orders appear in real-time on waiter page

-- ============================================
-- SCHEMA COMPLETE ✅
-- ============================================

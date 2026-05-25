-- ============================================
-- FRESH DATABASE SCHEMA - 2026
-- Digital Ordering Fee Model (No Subscriptions)
-- ============================================

-- Drop all existing tables (in correct order to handle foreign keys)
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
-- RESTAURANTS TABLE (Simplified)
-- ============================================
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    access_code TEXT NOT NULL, -- 4-digit code for admin/waiter login
    
    -- NEW: Order count tracking
    today_orders_count INTEGER DEFAULT 0,
    current_month_orders_count INTEGER DEFAULT 0,
    last_month_orders_count INTEGER DEFAULT 0,
    
    -- Agency/Contact info (for monthly reports)
    agency_name TEXT DEFAULT 'DineQR',
    agency_location TEXT DEFAULT 'India',
    agency_contact TEXT DEFAULT '+91-8333027544'
);

-- ============================================
-- STAFF TABLE (Simplified)
-- ============================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'waiter', -- 'admin' or 'waiter'
    access_code TEXT NOT NULL, -- 4-digit code
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP
);

-- ============================================
-- TABLES TABLE (Simplified)
-- ============================================
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number INTEGER NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- ============================================
-- CATEGORIES TABLE (Simplified)
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- ============================================
-- MENU ITEMS TABLE (Simplified)
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
-- ORDERS TABLE (Simplified - Auto-deleted on completion)
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Order details
    table_number INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'completed')),
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Digital ordering fee
    ordering_fee DECIMAL(10, 2) DEFAULT 7.00,
    
    -- Timestamps (only created_at needed)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    
    -- Snapshot data (in case menu item is deleted)
    menu_item_name TEXT NOT NULL,
    price_at_order DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- ============================================
-- DEMO REQUESTS TABLE (Simplified)
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

-- Order lookups
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- INSERT DEFAULT SUPER ADMIN
-- ============================================
-- Password: ramvanumu1579
INSERT INTO super_admins (name, email, password_hash, is_active)
VALUES (
    'Ram',
    'ramvanumu07@gmail.com',
    '$2b$10$f39AV7f.xDtRO12JqTeLG.yQxCcFMZtfUSw1J8kXVfwLwgk6iKpNG',
    true
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify:

-- SELECT * FROM super_admins;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'restaurants';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders';

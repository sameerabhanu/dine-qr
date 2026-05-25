-- ============================================
-- ENABLE SUPABASE REALTIME FOR TABLES
-- ============================================

-- Enable realtime for orders table (most important for waiter notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for other tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;

-- Verify realtime is enabled
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

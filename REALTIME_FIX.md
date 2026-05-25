# 🔄 ENABLE SUPABASE REALTIME - CRITICAL FIX

## Problem
Orders are not appearing in real-time on the waiter page. Refresh is needed.

## Root Cause
After applying the fresh schema migration, Supabase Realtime is not enabled for the `orders` table.

## Solution - Manual Steps (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `zyvwavxmfvcrrexhcsvp`
3. Navigate to **Database** > **Replication** (left sidebar)

### Step 2: Enable Realtime for Orders Table
1. Find the publication named `supabase_realtime`
2. Look for the `orders` table in the tables list
3. **Enable the toggle/checkbox for `orders` table**
4. **Also enable `order_items` table** (optional but recommended)

### Step 3: Verify
1. After enabling, you should see green checkmarks next to `orders` and `order_items`
2. The changes take effect immediately (no deployment needed)

### Step 4: Test
1. Open your waiter page
2. Place a test order from the customer page
3. The order should appear instantly on the waiter page without refresh

## Alternative: SQL Method

If you prefer SQL, you can run this in Supabase SQL Editor:

```sql
-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for order_items (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Verify
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

## Why This Happened
The `fresh-schema-2026.sql` migration dropped and recreated all tables, which removed them from the realtime publication. We need to re-enable realtime for the new tables.

## Screenshots Location
If you need help, check Supabase docs: https://supabase.com/docs/guides/realtime/postgres-changes

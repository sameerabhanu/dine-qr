# 🗄️ DineQR Database Setup Guide

## Complete Schema for New Clients

This directory contains the production-ready database schema for DineQR - a digital ordering system for restaurants.

## 📋 Quick Start

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready (2-3 minutes)

### Step 2: Run the Schema
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `FINAL-SCHEMA.sql`
3. Paste and click **RUN**
4. Wait for completion (should take ~5 seconds)

### Step 3: Enable Realtime (CRITICAL)
1. Go to **Database → Replication** in Supabase Dashboard
2. Find the `supabase_realtime` publication
3. Enable these tables:
   - ✅ orders
   - ✅ order_items
   - ✅ tables
   - ✅ staff

**Or run this SQL:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
```

### Step 4: Get Connection Details
From Supabase Dashboard → Settings → Database:
- `DATABASE_URL` - Direct connection (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` - API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

### Step 5: Update `.env.local`
```env
DATABASE_URL=your_pooler_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 6: Verify Installation
Run the seed script to test:
```bash
npm run seed
```

## 🔑 Default Super Admin Credentials

After running the schema, you can login with:
- **Email**: `admin@dineqr.com`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

## 📊 What's Included

### Tables
- `super_admins` - System administrators
- `restaurants` - Restaurant accounts
- `staff` - Restaurant admins & waiters (4-digit PIN auth)
- `tables` - Restaurant tables with QR codes
- `categories` - Menu categories
- `menu_items` - Menu items (veg/non-veg/egg)
- `orders` - Customer orders (auto-deleted after completion)
- `order_items` - Order line items
- `demo_requests` - Website demo requests

### Features
✅ Order count tracking (today/month/last-month)  
✅ Digital ordering fee system (₹7 default)  
✅ 4-digit PIN authentication for staff  
✅ Real-time order updates (Supabase Realtime)  
✅ Auto-delete orders after completion (only counts kept)  
✅ Monthly report email system  
✅ Multi-tenant (multiple restaurants)  
✅ PWA support with background notifications  

## 🔧 Troubleshooting

### Orders not appearing in real-time?
**Solution**: Enable Realtime for `orders` table (see Step 3)

### RLS blocking access?
**Solution**: Schema has RLS disabled. If re-enabled, run:
```sql
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
```

### Super admin can't login?
**Solution**: Run seed script to create admin:
```bash
npx tsx scripts/seed-supabase.ts
```

## 📝 Schema Highlights

### Business Model
- **No subscriptions** - Reseller/franchise model
- **Per-order fee** - ₹7 digital ordering fee per order
- **Monthly reports** - Email reports on 1st of each month
- **Order counting** - Only counts tracked, not full order history

### Authentication
- **Super Admin**: Email + Password (NextAuth)
- **Restaurant Staff**: 4-digit PIN (custom cookie auth)
- **Customers**: No authentication (order by table QR)

### Data Retention
- Orders: **Auto-deleted** after completion
- Counts: **Permanent** (for billing/reports)
- Menu/Categories: **Permanent**
- Staff/Tables: **Permanent**

## 🚀 Next Steps

After setup:
1. Login as super admin
2. Create your first restaurant
3. Add menu categories and items
4. Generate table QR codes
5. Test order flow
6. Set up monthly email reports

## 📞 Support

For issues or questions:
- Email: ramvanumu07@gmail.com
- GitHub: [dineqr repository]

---

**Schema Version**: 2026 Production  
**Last Updated**: May 2026  
**Status**: ✅ Production Ready

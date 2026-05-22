# DineQR - Complete Setup Guide

## Part 1: Push to New Git Repository

### Step 1: Authenticate with GitHub (sameerabhanu account)

**Generate Personal Access Token:**
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Note name: "DineQR Vercel Deploy"
4. Select scopes: ✅ repo (all)
5. Generate token and **COPY IT**

### Step 2: Push Code

```bash
cd c:\Users\ramva\Desktop\temp\SelfOrder\dineqr

# Remove old remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/sameerabhanu/dine-qr.git

# Push to new repo
git push -u origin main
```

**When prompted:**
- Username: `sameerabhanu`
- Password: `<paste your Personal Access Token>`

---

## Part 2: Supabase SQL Setup

### Step 1: Run Base Schema

Go to your **new Supabase SQL Editor** and run this:

```sql
-- Base Schema (Complete Tables)
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "menu_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" varchar(500),
	"customizations" jsonb DEFAULT '[]'::jsonb,
	"is_available" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"menu_item_name" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_at_order" numeric(10, 2) NOT NULL,
	"customizations" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"subtotal" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"table_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"special_instructions" text,
	"total_amount" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"preparing_at" timestamp,
	"ready_at" timestamp,
	"served_at" timestamp,
	"cancelled_at" timestamp
);

CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"subscription_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR',
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"payment_gateway" varchar(50) DEFAULT 'razorpay',
	"gateway_payment_id" varchar(255),
	"gateway_response" jsonb,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo_url" varchar(500),
	"phone" varchar(20),
	"email" varchar(255),
	"address" text,
	"primary_color" varchar(7) DEFAULT '#000000',
	"secondary_color" varchar(7) DEFAULT '#FFFFFF',
	"is_active" boolean DEFAULT true,
	"timezone" varchar(50) DEFAULT 'Asia/Kolkata',
	"currency" varchar(3) DEFAULT 'INR',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "restaurants_slug_unique" UNIQUE("slug")
);

CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp
);

CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"setup_fee_paid" boolean DEFAULT false,
	"setup_fee_amount" numeric(10, 2) DEFAULT '2499.00',
	"setup_fee_paid_at" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"next_billing_date" timestamp,
	"last_payment_date" timestamp,
	"auto_renew" boolean DEFAULT true,
	"payment_method_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "super_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "super_admins_email_unique" UNIQUE("email")
);

CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"qr_code" varchar(100) NOT NULL,
	"capacity" integer DEFAULT 4,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tables_qr_code_unique" UNIQUE("qr_code")
);

-- Foreign Key Constraints
ALTER TABLE "categories" ADD CONSTRAINT "categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "staff" ADD CONSTRAINT "staff_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tables" ADD CONSTRAINT "tables_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;
```

### Step 2: Run Migration Updates

After the base schema is created, run this in the **same SQL Editor**:

```sql
-- Migration Updates for DineQR Features

-- 1. Remove description columns (not used)
ALTER TABLE categories DROP COLUMN IF EXISTS description;
ALTER TABLE menu_items DROP COLUMN IF EXISTS description;

-- 2. Update menu_items for food type system
ALTER TABLE menu_items DROP COLUMN IF EXISTS image_url;
ALTER TABLE menu_items DROP COLUMN IF EXISTS customizations;
ALTER TABLE menu_items DROP COLUMN IF EXISTS is_veg;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS food_type VARCHAR(20) DEFAULT 'veg' NOT NULL;

-- 3. Add waiter support to orders
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

-- 5. Add access_code for staff (4-digit PIN authentication)
ALTER TABLE staff ADD COLUMN IF NOT EXISTS access_code VARCHAR(4);

-- 6. Make email and password nullable (for access code auth)
ALTER TABLE staff ALTER COLUMN email DROP NOT NULL;
ALTER TABLE staff ALTER COLUMN password_hash DROP NOT NULL;

-- 7. Enable Row Level Security for Supabase Realtime
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (full access for service role)
CREATE POLICY "Enable all access for service role" ON orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for service role" ON order_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. Enable Realtime for orders tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

### Step 3: Create Super Admin

Run this to create your super admin account:

```sql
-- Create super admin (password: admin123)
INSERT INTO super_admins (name, email, password_hash, is_active)
VALUES (
  'Super Admin',
  'admin@dineqr.com',
  '$2a$10$rZQ5YhF6d7J5yF.9QmF0qO0xN5K5xJ5N5K5xJ5N5K5xJ5N5K5xJ5NK',
  true
);
```

---

## Part 3: Vercel Environment Variables

Go to your **new Vercel Project Settings** → Environment Variables and add:

### Database (Supabase)
```
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

**How to get this:**
1. Go to Supabase Project Settings → Database
2. Copy the **Connection Pooler** URL (Transaction mode)
3. Replace `YOUR_PASSWORD` with your actual database password
4. **IMPORTANT**: Use `@@` (double @) if your password contains special characters

### Supabase Credentials
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

**How to get these:**
1. Go to Supabase Project Settings → API
2. Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Authentication
```
AUTH_SECRET=<generate-random-string>
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### App Configuration
```
NEXT_PUBLIC_APP_NAME=DineQR
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

**Note:** Update `NEXT_PUBLIC_APP_URL` after Vercel deployment with your actual domain.

### Cron Job Security (Optional)
```
CRON_SECRET=your-random-secret-key-change-this
```

---

## Part 4: Deploy to Vercel

1. **Import Git Repository:**
   - Go to: https://vercel.com/new
   - Import from GitHub
   - Select: `sameerabhanu/dine-qr`

2. **Configure Build Settings:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (leave default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (leave default)

3. **Add Environment Variables:**
   - Paste all variables from Part 3 above

4. **Deploy!**

---

## Part 5: Post-Deployment

1. **Update QR Code URL:**
   - After deployment, copy your Vercel domain
   - Update `NEXT_PUBLIC_APP_URL` in Vercel env variables
   - Redeploy

2. **Test Super Admin Login:**
   - Go to: `https://your-domain.vercel.app/admin/login`
   - Email: `admin@dineqr.com`
   - Password: `admin123`

3. **Create First Restaurant:**
   - Click "Add New Restaurant"
   - Fill in details
   - System will generate tables and QR codes automatically

---

## Troubleshooting

### Database Connection Errors
- Make sure you used the **Connection Pooler** URL (not direct connection)
- Use `@@` in password if it contains `@`
- Format: `postgresql://postgres.PROJECT_REF:PASSWORD@@aws-1-region.pooler.supabase.com:6543/postgres`

### Build Errors
- Check that all environment variables are set
- Verify `AUTH_SECRET` is set
- Check Vercel build logs

### Login Not Working
- Verify super admin was created in database
- Check `AUTH_SECRET` matches in Vercel
- Verify `NEXTAUTH_URL` is correct

---

## Success Checklist

✅ Code pushed to new GitHub repository  
✅ Supabase database schema created  
✅ Super admin account created  
✅ Vercel environment variables configured  
✅ Project deployed successfully  
✅ Super admin can login  
✅ Can create restaurants  
✅ QR codes work correctly  

---

**Need Help?** Check the console logs in:
- Vercel Deployment Logs
- Supabase Database Logs
- Browser Console (F12)

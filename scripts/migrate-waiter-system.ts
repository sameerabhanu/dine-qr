// Migration to add waiter support to orders table
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

async function migrate() {
  console.log('🔄 Starting waiter system migration...');

  try {
    // Add waiter columns to orders table
    console.log('Adding waiter columns to orders table...');
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS waiter_id UUID REFERENCES staff(id),
      ADD COLUMN IF NOT EXISTS waiter_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP
    `);

    // Add completed_at column
    console.log('Adding completed_at column...');
    await db.execute(sql`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP
    `);

    // Drop old status timestamp columns that are no longer needed
    console.log('Cleaning up old timestamp columns...');
    await db.execute(sql`
      ALTER TABLE orders 
      DROP COLUMN IF EXISTS accepted_at,
      DROP COLUMN IF EXISTS preparing_at,
      DROP COLUMN IF EXISTS ready_at
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

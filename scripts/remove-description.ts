import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

async function removeDescriptionColumns() {
  console.log('🗑️  Removing description columns...');

  try {
    // Remove description from menu_items
    await db.execute(sql`ALTER TABLE menu_items DROP COLUMN IF EXISTS description`);
    console.log('✅ Removed description from menu_items');

    // Remove description from categories
    await db.execute(sql`ALTER TABLE categories DROP COLUMN IF EXISTS description`);
    console.log('✅ Removed description from categories');

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

removeDescriptionColumns();

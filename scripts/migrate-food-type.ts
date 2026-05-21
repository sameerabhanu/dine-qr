// Manual migration to update menu_items table
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

async function migrate() {
  console.log('🔄 Starting migration...');

  try {
    // Add food_type column
    console.log('Adding food_type column...');
    await db.execute(sql`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS food_type VARCHAR(20) DEFAULT 'veg' NOT NULL
    `);

    // Migrate existing is_veg data to food_type
    console.log('Migrating is_veg to food_type...');
    await db.execute(sql`
      UPDATE menu_items 
      SET food_type = CASE 
        WHEN is_veg = true THEN 'veg'
        ELSE 'non-veg'
      END
      WHERE food_type = 'veg'
    `);

    // Drop old columns
    console.log('Dropping old columns...');
    await db.execute(sql`
      ALTER TABLE menu_items 
      DROP COLUMN IF EXISTS image_url,
      DROP COLUMN IF EXISTS customizations,
      DROP COLUMN IF EXISTS is_veg
    `);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

// Check database contents
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { restaurants } from '../lib/db/schema.js';

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

async function checkDatabase() {
  console.log('🔍 Checking database contents...');

  try {
    // Check restaurants
    const allRestaurants = await db.select().from(restaurants);
    
    console.log('\n📊 Restaurants in database:');
    if (allRestaurants.length === 0) {
      console.log('❌ No restaurants found!');
      console.log('\n💡 You need to create a restaurant first:');
      console.log('1. Go to http://localhost:3000/admin/login');
      console.log('2. Login as super admin (admin@dineqr.com / admin123)');
      console.log('3. Navigate to "Restaurants"');
      console.log('4. Click "Add Restaurant"');
      console.log('5. Create your restaurant with a slug (e.g., "hotel-2")');
    } else {
      console.log(`✅ Found ${allRestaurants.length} restaurant(s):\n`);
      allRestaurants.forEach((r) => {
        console.log(`  - Name: ${r.name}`);
        console.log(`    Slug: ${r.slug}`);
        console.log(`    Active: ${r.isActive}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

checkDatabase();

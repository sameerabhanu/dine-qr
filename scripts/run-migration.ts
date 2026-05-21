import postgres from 'postgres';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

async function runMigration() {
  const client = postgres(databaseUrl, { prepare: false });
  
  try {
    console.log('🔄 Running migration...');
    
    // Read the migration SQL file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'drizzle', '0000_spooky_dracula.sql'),
      'utf-8'
    );
    
    // Execute the migration
    await client.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 All tables created:');
    console.log('   - super_admins');
    console.log('   - restaurants');
    console.log('   - subscriptions');
    console.log('   - payments');
    console.log('   - tables');
    console.log('   - categories');
    console.log('   - menu_items');
    console.log('   - orders');
    console.log('   - order_items');
    console.log('   - staff');
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Check if tables already exist
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Tables already exist, skipping migration');
      } else {
        console.error('❌ Migration failed:', error.message);
        throw error;
      }
    } else {
      console.error('❌ Migration failed with unknown error');
      throw error;
    }
  } finally {
    await client.end();
  }
}

runMigration().catch((error) => {
  console.error(error);
  process.exit(1);
});

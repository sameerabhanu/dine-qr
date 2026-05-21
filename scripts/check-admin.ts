import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

async function checkAdmin() {
  const client = postgres(databaseUrl, { prepare: false });
  
  try {
    console.log('🔍 Checking super admin...\n');
    
    const result = await client`SELECT id, name, email, is_active, created_at FROM super_admins WHERE email = 'admin@dineqr.com'`;
    
    if (result.length === 0) {
      console.log('❌ Super admin not found!');
      console.log('   Run: npm run db:seed');
    } else {
      console.log('✅ Super admin found:');
      console.log('   ID:', result[0].id);
      console.log('   Name:', result[0].name);
      console.log('   Email:', result[0].email);
      console.log('   Active:', result[0].is_active);
      console.log('   Created:', result[0].created_at);
      console.log('\n✅ Login credentials:');
      console.log('   Email: admin@dineqr.com');
      console.log('   Password: admin123');
    }
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Unknown error occurred');
    }
  } finally {
    await client.end();
  }
}

checkAdmin();

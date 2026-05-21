import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('Database URL:', databaseUrl?.substring(0, 30) + '...');
  
  try {
    const client = postgres(databaseUrl, { prepare: false, connect_timeout: 10 });
    
    const result = await client`SELECT version()`;
    
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testConnection();

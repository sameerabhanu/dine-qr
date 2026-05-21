import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to query the database
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Supabase error:', error);
      process.exit(1);
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Note: Tables may not exist yet, but connection is working.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

testSupabase();

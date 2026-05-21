import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

async function pushSchema() {
  console.log('🔄 Pushing schema to Supabase...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Read the schema SQL
    const schemaSQL = readFileSync('./lib/db/schema-sql.sql', 'utf-8');
    
    // Execute via Supabase's SQL endpoint
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
    
    console.log('✅ Schema pushed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

pushSchema();

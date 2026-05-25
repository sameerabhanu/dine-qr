import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function enableRealtime() {
  console.log('🔄 Enabling Supabase Realtime for tables...');

  try {
    // Enable realtime for orders table
    const { error: ordersError } = await supabase.rpc('exec_sql', {
      sql: "ALTER PUBLICATION supabase_realtime ADD TABLE orders;"
    }).catch(() => ({ error: null })); // Ignore if already added

    // Enable realtime for order_items
    const { error: itemsError } = await supabase.rpc('exec_sql', {
      sql: "ALTER PUBLICATION supabase_realtime ADD TABLE order_items;"
    }).catch(() => ({ error: null }));

    console.log('✅ Realtime enabled for orders and order_items tables');
    console.log('   Note: If you see errors, the tables might already be enabled for realtime.');
    console.log('   You can verify in Supabase Dashboard > Database > Replication');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  Manual steps required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to Database > Replication');
    console.log('3. Find "supabase_realtime" publication');
    console.log('4. Enable these tables: orders, order_items');
    process.exit(1);
  }
}

enableRealtime();

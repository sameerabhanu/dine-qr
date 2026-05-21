import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';

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

async function checkSuperAdmin() {
  console.log('🔍 Checking super admin in Supabase...\n');

  try {
    // Get super admin
    const { data: admin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', 'admin@dineqr.com')
      .single();

    if (error) {
      console.error('❌ Error fetching super admin:', error);
      process.exit(1);
    }

    if (!admin) {
      console.log('❌ Super admin not found!');
      process.exit(1);
    }

    console.log('✅ Super admin found:');
    console.log('   ID:', admin.id);
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Active:', admin.is_active);
    console.log('   Password Hash:', admin.password_hash ? 'Present (length: ' + admin.password_hash.length + ')' : 'Missing');
    console.log('   Created:', admin.created_at);
    console.log('   Last Login:', admin.last_login_at);
    
    // Test password verification
    console.log('\n🔐 Testing password verification...');
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);
    
    if (isValid) {
      console.log('✅ Password "admin123" verifies successfully!');
    } else {
      console.log('❌ Password "admin123" does NOT verify!');
      console.log('   This means the password hash might be corrupted or incorrect.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

checkSuperAdmin();

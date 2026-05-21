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

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    const adminEmail = 'admin@dineqr.com';
    const adminPassword = 'admin123';

    // Check if admin exists
    const { data: existingAdmin, error: selectError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      process.exit(0);
      return;
    }

    if (selectError && selectError.code !== 'PGRST116') {
      throw selectError;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Insert admin
    const { data, error: insertError } = await supabase
      .from('super_admins')
      .insert({
        name: 'Super Admin',
        email: adminEmail,
        password_hash: passwordHash,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Super admin created:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!');
    console.log('🎉 Seeding complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

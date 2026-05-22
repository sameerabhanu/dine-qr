import 'dotenv/config';
import { db } from '../lib/db';
import { superAdmins } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testSuperAdminLogin() {
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  console.log('\n');
  console.log('Testing Super Admin Login...\n');

  // Check if super admin exists
  const admins = await db.select().from(superAdmins);
  console.log('All super admins in database:');
  console.log(JSON.stringify(admins, null, 2));
  console.log('\n');

  // Test email lookup
  const email = 'ram@admin.com';
  const [admin] = await db
    .select()
    .from(superAdmins)
    .where(eq(superAdmins.email, email))
    .limit(1);

  if (!admin) {
    console.log('❌ No admin found with email:', email);
    return;
  }

  console.log('✓ Found admin:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    isActive: admin.isActive,
    passwordHashPrefix: admin.passwordHash.substring(0, 20) + '...',
  });
  console.log('\n');

  // Test password verification
  const testPassword = 'ramvanumu1579';
  console.log('Testing password:', testPassword);
  console.log('Stored hash:', admin.passwordHash);
  
  const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
  console.log('Password verification result:', isValid ? '✅ VALID' : '❌ INVALID');

  if (!isValid) {
    // Generate a new hash
    console.log('\nGenerating new hash for password:', testPassword);
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('New hash:', newHash);
    console.log('Verification of new hash:', await bcrypt.compare(testPassword, newHash) ? '✅ VALID' : '❌ INVALID');
    
    console.log('\nTo fix, run this SQL in Supabase:');
    console.log(`UPDATE super_admins SET password_hash = '${newHash}' WHERE email = '${email}';`);
  }

  process.exit(0);
}

testSuperAdminLogin().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

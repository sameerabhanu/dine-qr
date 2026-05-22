import 'dotenv/config';
import { db } from '../lib/db';
import { superAdmins } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function diagnoseLogin() {
  console.log('='.repeat(60));
  console.log('SUPER ADMIN LOGIN DIAGNOSTIC');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Check all admins
  console.log('Step 1: Fetching all super admins from database...');
  const allAdmins = await db.select().from(superAdmins);
  console.log(`Found ${allAdmins.length} super admin(s):`);
  allAdmins.forEach((admin, i) => {
    console.log(`\n  Admin ${i + 1}:`);
    console.log(`    ID: ${admin.id}`);
    console.log(`    Email: ${admin.email}`);
    console.log(`    Name: ${admin.name}`);
    console.log(`    Is Active: ${admin.isActive}`);
    console.log(`    Password Hash: ${admin.passwordHash}`);
    console.log(`    Created At: ${admin.createdAt}`);
    console.log(`    Last Login: ${admin.lastLoginAt}`);
  });
  console.log('\n' + '-'.repeat(60));

  // Step 2: Test specific email
  const testEmail = 'ram@admin.com';
  console.log(`\nStep 2: Looking for admin with email: ${testEmail}`);
  const [admin] = await db
    .select()
    .from(superAdmins)
    .where(eq(superAdmins.email, testEmail))
    .limit(1);

  if (!admin) {
    console.log(`❌ NO ADMIN FOUND with email: ${testEmail}`);
    console.log('\nAvailable emails:');
    allAdmins.forEach(a => console.log(`  - ${a.email}`));
    console.log('\n⚠️  You need to either:');
    console.log(`   1. Login with one of the above emails, OR`);
    console.log(`   2. Update the email in database to: ${testEmail}`);
    console.log('\n' + '='.repeat(60));
    process.exit(1);
  }

  console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
  console.log(`   Active: ${admin.isActive}`);
  console.log(`   Hash: ${admin.passwordHash}`);
  console.log('\n' + '-'.repeat(60));

  // Step 3: Test password
  const testPassword = 'ramvanumu1579';
  console.log(`\nStep 3: Testing password: "${testPassword}"`);
  console.log(`Against hash: ${admin.passwordHash}`);
  
  const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
  console.log(`Result: ${isValid ? '✅ PASSWORD MATCHES' : '❌ PASSWORD DOES NOT MATCH'}`);

  if (!isValid) {
    console.log('\n⚠️  Password verification FAILED!');
    console.log('Generating new hash...');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`\nNew hash: ${newHash}`);
    
    // Verify new hash works
    const newHashWorks = await bcrypt.compare(testPassword, newHash);
    console.log(`New hash verification: ${newHashWorks ? '✅ WORKS' : '❌ FAILED'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('RUN THIS SQL IN SUPABASE:');
    console.log('='.repeat(60));
    console.log(`UPDATE super_admins`);
    console.log(`SET password_hash = '${newHash}'`);
    console.log(`WHERE email = '${testEmail}';`);
    console.log('='.repeat(60));
  } else {
    console.log('\n✅ Everything looks good!');
    console.log(`\nYou should be able to login with:`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: ${testPassword}`);
  }

  console.log('\n' + '='.repeat(60));
  process.exit(0);
}

diagnoseLogin().catch((error) => {
  console.error('\n❌ ERROR:', error);
  process.exit(1);
});

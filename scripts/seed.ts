// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Now import everything else
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/db/schema';
import { hashPassword } from '../lib/auth';
import { eq } from 'drizzle-orm';

const { superAdmins } = schema;

// Create db connection
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create super admin if doesn't exist
    const adminEmail = 'admin@dineqr.com';
    const adminPassword = 'admin123'; // CHANGE THIS IN PRODUCTION!

    const [existingAdmin] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, adminEmail))
      .limit(1);

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
    } else {
      const hashedPassword = await hashPassword(adminPassword);
      
      await db.insert(superAdmins).values({
        name: 'Super Admin',
        email: adminEmail,
        passwordHash: hashedPassword,
        isActive: true,
      });

      console.log('✅ Super admin created:');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   ⚠️  CHANGE THE PASSWORD AFTER FIRST LOGIN!');
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();

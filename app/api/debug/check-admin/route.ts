import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { superAdmins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    console.log('🔍 Checking database connection and super admin...');
    
    // Test database connection
    const [admin] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, 'admin@dineqr.com'))
      .limit(1);

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: 'Super admin not found in database',
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasAuthSecret: !!process.env.AUTH_SECRET,
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        }
      }, { status: 404 });
    }

    // Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', admin.passwordHash);

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        isActive: admin.isActive,
        hasPasswordHash: !!admin.passwordHash,
        passwordHashLength: admin.passwordHash?.length,
        passwordVerifies: isPasswordValid,
      },
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPreview: process.env.DATABASE_URL?.substring(0, 30) + '...',
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      }
    });
  } catch (error: any) {
    console.error('❌ Debug check failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      }
    }, { status: 500 });
  }
}

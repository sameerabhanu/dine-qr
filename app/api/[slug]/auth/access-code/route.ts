import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { accessCode } = body;

    if (!accessCode || !/^\d{4}$/.test(accessCode)) {
      return NextResponse.json(
        { error: 'Invalid access code format' },
        { status: 400 }
      );
    }

    // Find restaurant by slug
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Find staff with matching access code for this restaurant
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.restaurantId, restaurant.id),
          eq(staff.accessCode, accessCode),
          eq(staff.isActive, true)
        )
      )
      .limit(1);

    if (!staffMember) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }

    // Update last login
    await db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, staffMember.id));

    // Set a secure cookie for authentication
    const cookieStore = await cookies();
    const cookieName = `restaurant_${slug}_auth`;
    const cookieValue = staffMember.id;
    
    console.log('🍪 Setting cookie:', {
      name: cookieName,
      value: cookieValue,
      path: `/${slug}`,
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set(cookieName, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',  // Changed from /${slug} to / for broader access
    });

    console.log('✅ Cookie set successfully');

    return NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        role: staffMember.role,
        restaurantId: staffMember.restaurantId,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Access code auth error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

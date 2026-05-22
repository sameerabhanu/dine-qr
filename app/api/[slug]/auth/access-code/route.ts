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

    const cookieName = `restaurant_${slug}_auth`;
    const activityCookieName = `restaurant_${slug}_activity`;
    
    console.log('🍪 Setting cookies via NextResponse');

    // Create response with cookies set properly in headers
    const response = NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        role: staffMember.role,
        restaurantId: staffMember.restaurantId,
      },
    });

    // Set auth cookie in response
    response.cookies.set(cookieName, staffMember.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    // Set activity timestamp cookie
    response.cookies.set(activityCookieName, Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    console.log('✅ Cookies set in response headers');

    return response;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Access code auth error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

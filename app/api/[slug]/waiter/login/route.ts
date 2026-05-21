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
    const { pin } = body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format. Must be 4 digits.' },
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

    // Find waiter with matching PIN for this restaurant
    const [waiter] = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.restaurantId, restaurant.id),
          eq(staff.accessCode, pin),
          eq(staff.role, 'waiter'),
          eq(staff.isActive, true)
        )
      )
      .limit(1);

    if (!waiter) {
      return NextResponse.json(
        { error: 'Invalid PIN or not a waiter' },
        { status: 401 }
      );
    }

    // Update last login
    await db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, waiter.id));

    // Set a secure cookie for authentication
    const cookieStore = await cookies();
    const cookieName = `waiter_${slug}_auth`;
    const cookieValue = waiter.id;
    
    console.log('🍽️ Setting waiter cookie:', {
      name: cookieName,
      value: cookieValue,
      waiterName: waiter.name,
    });

    cookieStore.set(cookieName, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    console.log('✅ Waiter logged in successfully');

    return NextResponse.json({
      success: true,
      waiter: {
        id: waiter.id,
        name: waiter.name,
        restaurantId: waiter.restaurantId,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Waiter login error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

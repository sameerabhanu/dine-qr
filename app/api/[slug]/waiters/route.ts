import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getRestaurantAuth } from '@/lib/restaurant-auth';
import { auth } from '@/auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Check authentication (restaurant owner or super admin)
    const restaurantAuth = await getRestaurantAuth(slug);
    const session = await auth();
    
    if (!restaurantAuth && session?.user.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, pin } = body;

    if (!name || !pin) {
      return NextResponse.json(
        { error: 'Name and PIN are required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Check if PIN already exists for this restaurant
    const [existingWaiter] = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.restaurantId, restaurant.id),
          eq(staff.accessCode, pin),
          eq(staff.role, 'waiter')
        )
      )
      .limit(1);

    if (existingWaiter) {
      return NextResponse.json(
        { error: 'A waiter with this PIN already exists' },
        { status: 400 }
      );
    }

    // Create waiter
    const [waiter] = await db
      .insert(staff)
      .values({
        id: randomUUID(),
        restaurantId: restaurant.id,
        name,
        accessCode: pin,
        role: 'waiter',
        isActive: true,
      })
      .returning();

    console.log('✅ Waiter created:', {
      name: waiter.name,
      pin,
      restaurantId: restaurant.id,
    });

    return NextResponse.json({
      success: true,
      waiter: {
        id: waiter.id,
        name: waiter.name,
        accessCode: waiter.accessCode,
      },
      message: 'Waiter added successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to add waiter';
    console.error('Error adding waiter:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

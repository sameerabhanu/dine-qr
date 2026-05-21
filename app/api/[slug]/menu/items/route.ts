import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { menuItems, restaurants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const allItems = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurant.id))
      .orderBy(menuItems.displayOrder);

    return NextResponse.json({ items: allItems });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu items';
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    const { slug } = await context.params;

    if (!session) {
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

    if (
      session.user.userType !== 'super_admin' &&
      session.user.restaurantId !== restaurant.id
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      categoryId,
      foodType,
      isAvailable,
      displayOrder,
    } = body;

    if (!name || !price || !categoryId || !foodType) {
      return NextResponse.json(
        { error: 'Name, price, category, and food type are required' },
        { status: 400 }
      );
    }

    // Validate food type
    if (!['veg', 'egg', 'non-veg'].includes(foodType)) {
      return NextResponse.json(
        { error: 'Food type must be veg, egg, or non-veg' },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(menuItems)
      .values({
        id: randomUUID(),
        restaurantId: restaurant.id,
        categoryId,
        name,
        description: description || null,
        price: price.toString(),
        foodType,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        displayOrder: displayOrder || 0,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({ item, message: 'Menu item created successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create menu item';
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

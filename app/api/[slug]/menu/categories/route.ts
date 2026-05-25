import { NextRequest, NextResponse } from 'next/server';
import { verifyRestaurantApiAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const allCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, authResult.restaurant.id))
      .orderBy(categories.displayOrder);

    return NextResponse.json({ categories: allCategories });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const [category] = await db
      .insert(categories)
      .values({
        id: randomUUID(),
        restaurantId: authResult.restaurant.id,
        name,
        displayOrder: displayOrder || 0,
      })
      .returning();

    return NextResponse.json({ category, message: 'Category created successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
    console.error('Error creating category:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyRestaurantApiAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { categories, menuItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;

    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.restaurantId, authResult.restaurant.id)
      ))
      .limit(1);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch category';
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;

    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayOrder } = body;

    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: name || undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
      })
      .where(and(
        eq(categories.id, id),
        eq(categories.restaurantId, authResult.restaurant.id)
      ))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ category: updatedCategory, message: 'Category updated successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
    console.error('Error updating category:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;

    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    await db
      .delete(menuItems)
      .where(and(
        eq(menuItems.categoryId, id),
        eq(menuItems.restaurantId, authResult.restaurant.id)
      ));

    await db
      .delete(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.restaurantId, authResult.restaurant.id)
      ));

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

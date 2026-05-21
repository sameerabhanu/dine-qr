import { NextRequest, NextResponse } from 'next/server';
import { verifyRestaurantApiAuth } from '@/lib/api-auth';
import { db } from '@/lib/db';
import { menuItems } from '@/lib/db/schema';
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

    const [item] = await db
      .select()
      .from(menuItems)
      .where(and(
        eq(menuItems.id, id),
        eq(menuItems.restaurantId, authResult.restaurant.id)
      ))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu item';
    console.error('Error fetching menu item:', error);
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
    const {
      name,
      price,
      categoryId,
      foodType,
      isAvailable,
      displayOrder,
    } = body;

    // Validate food type if provided
    if (foodType && !['veg', 'egg', 'non-veg'].includes(foodType)) {
      return NextResponse.json(
        { error: 'Food type must be veg, egg, or non-veg' },
        { status: 400 }
      );
    }

    const [updatedItem] = await db
      .update(menuItems)
      .set({
        name: name || undefined,
        price: price !== undefined ? price.toString() : undefined,
        categoryId: categoryId || undefined,
        foodType: foodType || undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
      })
      .where(and(
        eq(menuItems.id, id),
        eq(menuItems.restaurantId, authResult.restaurant.id)
      ))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ item: updatedItem, message: 'Menu item updated successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
    console.error('Error updating menu item:', error);
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
        eq(menuItems.id, id),
        eq(menuItems.restaurantId, authResult.restaurant.id)
      ));

    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item';
    console.error('Error deleting menu item:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { categories, restaurants, menuItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await context.params;

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.restaurantId, restaurant.id)
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
    const session = await auth();
    const { slug, id } = await context.params;

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
    const { name, displayOrder } = body;

    const [updatedCategory] = await db
      .update(categories)
      .set({
        name: name || undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
      })
      .where(and(
        eq(categories.id, id),
        eq(categories.restaurantId, restaurant.id)
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
    const session = await auth();
    const { slug, id } = await context.params;

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

    await db
      .delete(menuItems)
      .where(and(
        eq(menuItems.categoryId, id),
        eq(menuItems.restaurantId, restaurant.id)
      ));

    await db
      .delete(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.restaurantId, restaurant.id)
      ));

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

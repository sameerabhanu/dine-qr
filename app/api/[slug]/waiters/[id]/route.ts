import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json();
    const { name, accessCode, isActive } = body;

    // Get restaurant ID from slug
    const { restaurants } = await import('@/lib/db/schema');
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (accessCode !== undefined) updateData.accessCode = accessCode;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update waiter
    const [updatedWaiter] = await db
      .update(staff)
      .set(updateData)
      .where(and(
        eq(staff.id, id),
        eq(staff.restaurantId, restaurant.id),
        eq(staff.role, 'waiter')
      ))
      .returning();

    if (!updatedWaiter) {
      return NextResponse.json({ error: 'Waiter not found' }, { status: 404 });
    }

    return NextResponse.json(updatedWaiter);
  } catch (error) {
    console.error('Error updating waiter:', error);
    return NextResponse.json(
      { error: 'Failed to update waiter' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;

    // Get restaurant ID from slug
    const { restaurants } = await import('@/lib/db/schema');
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Delete waiter
    const [deletedWaiter] = await db
      .delete(staff)
      .where(and(
        eq(staff.id, id),
        eq(staff.restaurantId, restaurant.id),
        eq(staff.role, 'waiter')
      ))
      .returning();

    if (!deletedWaiter) {
      return NextResponse.json({ error: 'Waiter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting waiter:', error);
    return NextResponse.json(
      { error: 'Failed to delete waiter' },
      { status: 500 }
    );
  }
}

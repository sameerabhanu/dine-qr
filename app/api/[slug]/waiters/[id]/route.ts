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

    // Get restaurant ID from slug and verify auth
    const { verifyRestaurantApiAuth } = await import('@/lib/api-auth');
    
    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
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
        eq(staff.restaurantId, authResult.restaurant.id),
        eq(staff.role, 'waiter')
      ))
      .returning();

    if (!updatedWaiter) {
      return NextResponse.json({ error: 'Waiter not found' }, { status: 404 });
    }

    return NextResponse.json(updatedWaiter);
  } catch (error) {
    console.error('Error updating waiter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update waiter';
    return NextResponse.json(
      { error: errorMessage },
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

    // Get restaurant ID from slug and verify auth
    const { restaurants } = await import('@/lib/db/schema');
    const { verifyRestaurantApiAuth } = await import('@/lib/api-auth');
    
    const authResult = await verifyRestaurantApiAuth(slug);
    if (!authResult.authorized || !authResult.restaurant) {
      return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
    }

    // First, update all orders that reference this waiter to set waiterId to null
    const { orders } = await import('@/lib/db/schema');
    await db
      .update(orders)
      .set({ waiterId: null })
      .where(eq(orders.waiterId, id));

    // Now delete the waiter
    const [deletedWaiter] = await db
      .delete(staff)
      .where(and(
        eq(staff.id, id),
        eq(staff.restaurantId, authResult.restaurant.id),
        eq(staff.role, 'waiter')
      ))
      .returning();

    if (!deletedWaiter) {
      return NextResponse.json({ error: 'Waiter not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting waiter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete waiter';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

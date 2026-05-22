import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { restaurants, staff, tables, categories, menuItems, orders, orderItems, subscriptions, payments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Delete in correct order to handle foreign key constraints
    // 1. Delete order items first
    await db.delete(orderItems).where(
      eq(orderItems.orderId, db.select({ id: orders.id }).from(orders).where(eq(orders.restaurantId, id)) as any)
    );

    // 2. Delete orders
    await db.delete(orders).where(eq(orders.restaurantId, id));

    // 3. Delete menu items
    await db.delete(menuItems).where(eq(menuItems.restaurantId, id));

    // 4. Delete categories
    await db.delete(categories).where(eq(categories.restaurantId, id));

    // 5. Delete tables
    await db.delete(tables).where(eq(tables.restaurantId, id));

    // 6. Delete payments
    await db.delete(payments).where(eq(payments.restaurantId, id));

    // 7. Delete subscriptions
    await db.delete(subscriptions).where(eq(subscriptions.restaurantId, id));

    // 8. Delete staff
    await db.delete(staff).where(eq(staff.restaurantId, id));

    // 9. Finally delete restaurant
    await db.delete(restaurants).where(eq(restaurants.id, id));

    return NextResponse.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}

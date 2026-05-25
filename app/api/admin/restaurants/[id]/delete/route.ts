import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { restaurants, staff, tables, categories, menuItems, orders, orderItems } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

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
    
    // 1. Get all orders for this restaurant
    const restaurantOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.restaurantId, id));
    
    const orderIds = restaurantOrders.map(o => o.id);

    // 2. Delete order items for these orders
    if (orderIds.length > 0) {
      await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    }

    // 3. Delete orders
    await db.delete(orders).where(eq(orders.restaurantId, id));

    // 4. Delete menu items
    await db.delete(menuItems).where(eq(menuItems.restaurantId, id));

    // 5. Delete categories
    await db.delete(categories).where(eq(categories.restaurantId, id));

    // 6. Delete tables
    await db.delete(tables).where(eq(tables.restaurantId, id));

    // 7. Delete staff
    await db.delete(staff).where(eq(staff.restaurantId, id));

    // 8. Finally delete restaurant (CASCADE will handle remaining dependencies)
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

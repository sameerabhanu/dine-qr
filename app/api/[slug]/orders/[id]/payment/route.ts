import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, restaurants, orderItems } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getWaiterAuth } from '@/lib/waiter-auth';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: orderId } = await context.params;
    const body = await request.json();
    const { paymentMethod } = body;

    // Verify waiter is authenticated
    const waiter = await getWaiterAuth(slug);
    if (!waiter) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as waiter.' },
        { status: 401 }
      );
    }

    if (!paymentMethod || !['cash', 'card', 'upi'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Must be cash, card, or upi.' },
        { status: 400 }
      );
    }

    console.log('✅ Marking order as completed:', {
      orderId,
      paymentMethod,
      waiterId: waiter.id,
      waiterName: waiter.name,
    });

    // First, fetch the order to get restaurant ID
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.waiterId, waiter.id)
        )
      );

    if (!existingOrder) {
      console.log('⚠️ Order not found or not assigned to this waiter');
      return NextResponse.json(
        { error: 'Order not found or you are not assigned to this order' },
        { status: 404 }
      );
    }

    // Get current date info for determining which counters to increment
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Determine which counters to increment based on order creation time
    const orderCreatedAt = new Date(existingOrder.createdAt!);
    const isToday = orderCreatedAt >= today;
    const isThisMonth = orderCreatedAt >= monthStart;

    console.log('📊 Incrementing order counters:', {
      orderId,
      restaurantId: existingOrder.restaurantId,
      orderCreatedAt,
      isToday,
      isThisMonth,
    });

    // Increment restaurant order counters
    const updateData: any = {};
    if (isToday) {
      updateData.todayOrdersCount = sql`${restaurants.todayOrdersCount} + 1`;
    }
    if (isThisMonth) {
      updateData.currentMonthOrdersCount = sql`${restaurants.currentMonthOrdersCount} + 1`;
    }

    if (Object.keys(updateData).length > 0) {
      await db
        .update(restaurants)
        .set(updateData)
        .where(eq(restaurants.id, existingOrder.restaurantId));
    }

    // Delete order items first (foreign key constraint)
    await db
      .delete(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Delete the order
    await db
      .delete(orders)
      .where(eq(orders.id, orderId));

    console.log('✅ Order completed, counters updated, and order deleted');

    return NextResponse.json({
      success: true,
      message: 'Order completed, payment collected, and order archived',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to complete order';
    console.error('Complete order error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

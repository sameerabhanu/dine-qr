import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, restaurants, orderItems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: orderId } = await context.params;

    console.log('✅ Admin confirming payment for order:', orderId);

    // First, fetch the order
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrder) {
      console.log('⚠️ Order not found');
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order is in payment_collected status
    if (existingOrder.status !== 'payment_collected') {
      console.log('⚠️ Order is not awaiting payment confirmation');
      return NextResponse.json(
        { error: 'Order is not awaiting payment confirmation' },
        { status: 400 }
      );
    }

    // Get current date info for determining which counters to increment
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

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

    console.log('✅ Payment confirmed, counters updated, and order deleted');

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed and order completed',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

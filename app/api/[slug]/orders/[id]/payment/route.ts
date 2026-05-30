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

    console.log('✅ Marking order as payment collected:', {
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

    // Update order status to 'payment_collected' (awaiting admin confirmation)
    await db
      .update(orders)
      .set({ status: 'payment_collected' })
      .where(eq(orders.id, orderId));

    console.log('✅ Order marked as payment_collected, awaiting admin confirmation');

    return NextResponse.json({
      success: true,
      message: 'Payment collected. Awaiting admin confirmation.',
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

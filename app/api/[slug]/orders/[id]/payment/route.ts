import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

    // Update order - mark as completed with payment details
    // Allow if order is claimed OR served by this waiter
    const result = await db
      .update(orders)
      .set({
        status: 'completed',
        paymentMethod,
        paymentStatus: 'completed',
        servedAt: new Date(), // Set served time if not already set
        paidAt: new Date(),
        completedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.waiterId, waiter.id), // Only the waiter who claimed can complete
          // Allow both 'claimed' and 'served' status
        )
      )
      .returning();

    if (result.length === 0) {
      console.log('⚠️ Order not found or not assigned to this waiter');
      return NextResponse.json(
        { error: 'Order not found or you are not assigned to this order' },
        { status: 404 }
      );
    }

    const [completedOrder] = result;
    console.log('✅ Order completed successfully');

    return NextResponse.json({
      success: true,
      order: completedOrder,
      message: 'Order completed and payment collected',
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

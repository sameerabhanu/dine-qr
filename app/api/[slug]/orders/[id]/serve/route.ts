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

    // Verify waiter is authenticated
    const waiter = await getWaiterAuth(slug);
    if (!waiter) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as waiter.' },
        { status: 401 }
      );
    }

    console.log('✅ Marking order as served:', {
      orderId,
      waiterId: waiter.id,
      waiterName: waiter.name,
    });

    // Update order status to served
    // Only allow if order is claimed by this waiter
    const result = await db
      .update(orders)
      .set({
        status: 'served',
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.waiterId, waiter.id), // Only allow the waiter who claimed it
          eq(orders.status, 'claimed') // Must be in claimed status
        )
      )
      .returning();

    if (result.length === 0) {
      console.log('⚠️ Order not found or not claimedby this waiter');
      return NextResponse.json(
        { error: 'Order not found or you are not assigned to this order' },
        { status: 404 }
      );
    }

    const [servedOrder] = result;
    console.log('✅ Order marked as served successfully');

    return NextResponse.json({
      success: true,
      order: servedOrder,
      message: 'Order marked as served',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as served';
    console.error('Serve order error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

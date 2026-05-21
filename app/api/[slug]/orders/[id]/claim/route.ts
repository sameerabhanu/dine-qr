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

    console.log('🎯 Attempting to claim order:', {
      orderId,
      waiterId: waiter.id,
      waiterName: waiter.name,
    });

    // Use transaction with WHERE clause to prevent collision
    // Only update if status is still 'pending'
    const result = await db
      .update(orders)
      .set({
        status: 'claimed',
        waiterId: waiter.id,
        waiterName: waiter.name,
        claimedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.status, 'pending') // Critical: only claim if still pending
        )
      )
      .returning();

    // If no rows were updated, order was already claimed
    if (result.length === 0) {
      console.log('⚠️ Order already claimed by another waiter');
      return NextResponse.json(
        { error: 'This order has already been claimed by another waiter' },
        { status: 409 } // 409 Conflict
      );
    }

    const [claimedOrder] = result;
    console.log('✅ Order claimed successfully');

    return NextResponse.json({
      success: true,
      order: claimedOrder,
      message: 'Order claimed successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to claim order';
    console.error('Order claim error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

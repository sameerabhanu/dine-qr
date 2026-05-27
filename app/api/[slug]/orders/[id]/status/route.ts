import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getWaiterAuth } from '@/lib/waiter-auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: orderId } = await context.params;
    const body = await request.json();
    const { status } = body;

    // Verify waiter is authenticated
    const waiter = await getWaiterAuth(slug);
    if (!waiter) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login as waiter.' },
        { status: 401 }
      );
    }

    if (!status || !['claimed', 'served'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be claimed or served.' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating order status:', {
      orderId,
      newStatus: status,
      waiterId: waiter.id,
    });

    // Update the order status
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('✅ Order status updated successfully');

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order status';
    console.error('Order status update error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

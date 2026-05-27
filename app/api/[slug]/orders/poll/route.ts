import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and, inArray, or, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const waiterId = searchParams.get('waiterId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Missing restaurantId' }, { status: 400 });
    }

    // Lightweight query - only count, no joins, no items
    const [pendingResult, myOrdersResult] = await Promise.all([
      // Count pending orders for this waiter
      // Show orders where waiterId=this waiter OR waiterId=null (new tables)
      waiterId
        ? db
            .select({ id: orders.id })
            .from(orders)
            .where(
              and(
                eq(orders.restaurantId, restaurantId),
                eq(orders.status, 'pending'),
                or(
                  eq(orders.waiterId, waiterId),
                  isNull(orders.waiterId)
                )
              )
            )
        : db
            .select({ id: orders.id })
            .from(orders)
            .where(
              and(
                eq(orders.restaurantId, restaurantId),
                eq(orders.status, 'pending')
              )
            ),
      
      // Count waiter's orders
      waiterId
        ? db
            .select({ id: orders.id })
            .from(orders)
            .where(
              and(
                eq(orders.restaurantId, restaurantId),
                eq(orders.waiterId, waiterId),
                inArray(orders.status, ['claimed', 'served'])
              )
            )
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      pendingCount: pendingResult.length,
      myOrdersCount: myOrdersResult.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json({ error: 'Failed to poll' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, tables, orderItems } from '@/lib/db/schema';
import { eq, and, inArray, desc, or, isNull } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const restaurantId = searchParams.get('restaurantId');
    const waiterId = searchParams.get('waiterId');

    if (!restaurantId || !waiterId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Fetch pending orders for this waiter
    // Show orders where waiterId=this waiter OR waiterId=null (new tables)
    const pendingOrdersData = await db
      .select({
        order: orders,
        table: tables,
      })
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
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
      .orderBy(orders.createdAt);

    // Fetch orders claimed by this waiter
    const myOrdersData = await db
      .select({
        order: orders,
        table: tables,
      })
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          eq(orders.waiterId, waiterId),
          inArray(orders.status, ['claimed', 'served'])
        )
      )
      .orderBy(desc(orders.createdAt));

    // Collect all order IDs
    const allOrderIds = [
      ...pendingOrdersData.map(o => o.order.id),
      ...myOrdersData.map(o => o.order.id),
    ];

    // Fetch ALL order items in a single query
    const allItems = allOrderIds.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, allOrderIds))
      : [];

    // Group items by order ID
    const itemsByOrderId = allItems.reduce((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<string, typeof allItems>);

    // Attach items to orders
    const pending = pendingOrdersData.map((orderData) => ({
      ...orderData,
      items: itemsByOrderId[orderData.order.id] || [],
    }));

    const myOrders = myOrdersData.map((orderData) => ({
      ...orderData,
      items: itemsByOrderId[orderData.order.id] || [],
    }));

    return NextResponse.json({
      pending,
      myOrders,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Updates fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
  }
}

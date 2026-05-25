import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, tables, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch order with table
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch table (if tableId exists)
    let table = null;
    if (order.tableId) {
      [table] = await db
        .select()
        .from(tables)
        .where(eq(tables.id, order.tableId))
        .limit(1);
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    return NextResponse.json({
      order: {
        order,
        table,
        items,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}

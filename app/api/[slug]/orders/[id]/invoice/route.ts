import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, tables, restaurants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: orderId } = await context.params;

    // Fetch order with all details
    const [orderData] = await db
      .select({
        order: orders,
        table: tables,
        restaurant: restaurants,
      })
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .leftJoin(restaurants, eq(orders.restaurantId, restaurants.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    // Calculate bill details
    const subtotal = parseFloat(orderData.order.totalAmount || '0');
    const gst = subtotal * 0.05; // 5% GST
    const serviceCharge = subtotal * 0.10; // 10% service charge
    const total = subtotal + gst + serviceCharge;

    return NextResponse.json({
      success: true,
      invoice: {
        order: orderData.order,
        table: orderData.table,
        restaurant: orderData.restaurant,
        items,
        billing: {
          subtotal: subtotal.toFixed(2),
          gst: gst.toFixed(2),
          gstPercentage: 5,
          serviceCharge: serviceCharge.toFixed(2),
          serviceChargePercentage: 10,
          total: total.toFixed(2),
        },
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch invoice';
    console.error('Invoice fetch error:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

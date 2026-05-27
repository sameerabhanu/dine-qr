import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, tables, orderItems } from '@/lib/db/schema';
import { eq, and, inArray, desc, or, isNull } from 'drizzle-orm';
import { requireWaiterAuth } from '@/lib/waiter-auth';
import WaiterDashboard from './WaiterDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function WaiterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch restaurant
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);

  if (!restaurant) {
    notFound();
  }

  // Check waiter authentication
  const { waiter } = await requireWaiterAuth(slug, `/${slug}/waiter`);

  // Fetch pending orders for this waiter
  // Show orders where:
  // 1. status='pending' AND waiterId=this waiter (orders auto-assigned to them)
  // 2. status='pending' AND waiterId=null (new orders from tables with no waiter yet)
  const pendingOrdersData = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        eq(orders.status, 'pending'),
        or(
          eq(orders.waiterId, waiter.id), // Orders assigned to this waiter
          isNull(orders.waiterId) // Orders from new tables (no waiter assigned yet)
        )
      )
    )
    .orderBy(orders.createdAt);

  // Fetch orders claimed by this waiter (both claimed and served status)
  const myOrdersData = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        eq(orders.waiterId, waiter.id),
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
  const pendingOrders = pendingOrdersData.map((orderData) => ({
    ...orderData,
    items: itemsByOrderId[orderData.order.id] || [],
  }));

  const myOrders = myOrdersData.map((orderData) => ({
    ...orderData,
    items: itemsByOrderId[orderData.order.id] || [],
  }));

  return (
    <WaiterDashboard
      restaurant={restaurant}
      waiter={waiter}
      pendingOrders={pendingOrders}
      myOrders={myOrders}
      slug={slug}
    />
  );
}

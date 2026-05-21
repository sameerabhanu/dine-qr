import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, orderItems, menuItems, tables } from '@/lib/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import KitchenDisplay from './KitchenDisplay';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication and get restaurant
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/kitchen`);

  // Fetch active orders with their items
  const activeOrders = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        or(
          eq(orders.status, 'pending'),
          eq(orders.status, 'preparing'),
          eq(orders.status, 'ready')
        )
      )
    )
    .orderBy(desc(orders.createdAt));

  // Fetch order items for all active orders
  const orderIds = activeOrders.map(o => o.order.id);
  const items = orderIds.length > 0
    ? await db
        .select({
          orderItem: orderItems,
          menuItem: menuItems,
        })
        .from(orderItems)
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(
          or(
            ...orderIds.map(id => eq(orderItems.orderId, id))
          )
        )
    : [];

  // Group items by order
  const ordersWithItems = activeOrders.map(({ order, table }) => ({
    ...order,
    table: table,
    items: items
      .filter(item => item.orderItem.orderId === order.id)
      .map(item => ({
        ...item.orderItem,
        menuItem: item.menuItem,
      })),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <KitchenDisplay restaurant={restaurant} orders={ordersWithItems} />
    </div>
  );
}

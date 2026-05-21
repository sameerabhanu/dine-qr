import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, menuItems, categories, tables } from '@/lib/db/schema';
import { eq, desc, and, gte, count } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { ChefHat, ShoppingBag, DollarSign, TrendingUp, Settings, Menu, Plus } from 'lucide-react';

export default async function RestaurantAdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication and get restaurant
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin`);

  // Get today's date
  const today = startOfDay(new Date());
  const thisWeek = startOfWeek(new Date());
  const thisMonth = startOfMonth(new Date());

  // Fetch statistics
  const [todayOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        gte(orders.createdAt, today)
      )
    );

  const [totalOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.restaurantId, restaurant.id));

  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.restaurantId, restaurant.id));

  const todayRevenue = allOrders
    .filter(o => o.createdAt && new Date(o.createdAt) >= today)
    .reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);

  const [menuItemsCount] = await db
    .select({ count: count() })
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id));

  const [tablesCount] = await db
    .select({ count: count() })
    .from(tables)
    .where(eq(tables.restaurantId, restaurant.id));

  // Fetch recent orders
  const recentOrders = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(eq(orders.restaurantId, restaurant.id))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurant.name} Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your restaurant operations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <LogoutButton slug={slug} />
              <Link
                href={`/${slug}/kitchen`}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition font-medium flex items-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                Kitchen Display
              </Link>
              <Link
                href={`/${slug}`}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium"
              >
                View Menu
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Today&apos;s Orders</p>
            <p className="text-3xl font-bold text-gray-900">{todayOrders.count}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Today&apos;s Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(todayRevenue)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Menu className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Menu Items</p>
            <p className="text-3xl font-bold text-gray-900">{menuItemsCount.count}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              href={`/${slug}/admin/menu`}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center"
            >
              <Menu className="w-8 h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Manage Menu</p>
              <p className="text-sm text-gray-500 mt-1">Add, edit, or remove items</p>
            </Link>
            <Link
              href={`/${slug}/admin/tables`}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center"
            >
              <Settings className="w-8 h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Manage Tables</p>
              <p className="text-sm text-gray-500 mt-1">View QR codes and settings</p>
            </Link>
            <Link
              href={`/${slug}/admin/waiters`}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center"
            >
              <Plus className="w-8 h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Manage Waiters</p>
              <p className="text-sm text-gray-500 mt-1">Add and manage waiters</p>
            </Link>
            <Link
              href={`/${slug}/admin/orders/completed`}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center"
            >
              <ChefHat className="w-8 h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">Completed Orders</p>
              <p className="text-sm text-gray-500 mt-1">View today's revenue</p>
            </Link>
            <Link
              href={`/${slug}/admin/orders`}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-center"
            >
              <ShoppingBag className="w-8 h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900">All Orders</p>
              <p className="text-sm text-gray-500 mt-1">Order history</p>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500">Orders will appear here once customers start ordering</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Table
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map(({ order, table }) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Table {table?.tableNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatCurrency(parseFloat(order.totalAmount || '0'))}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'served'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'claimed'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'pending'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, menuItems, categories, tables } from '@/lib/db/schema';
import { eq, desc, and, gte, count } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { ChefHat, ShoppingBag, TrendingUp, Settings, Menu, Plus } from 'lucide-react';

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

  // Fetch today's orders
  const todayOrdersList = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        gte(orders.createdAt, today)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Responsive */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {restaurant.name}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
                Manage your restaurant operations
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <LogoutButton slug={slug} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Stats Grid - Always Side by Side */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Today&apos;s Orders</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{todayOrders.count}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Today&apos;s Revenue</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">
              {formatCurrency(todayRevenue)}
            </p>
          </div>
        </div>

        {/* Quick Actions - Mobile Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link
              href={`/${slug}/admin/menu`}
              className="p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 transition text-center"
            >
              <Menu className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Manage Menu</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Add, edit, or remove items</p>
            </Link>
            <Link
              href={`/${slug}/admin/tables`}
              className="p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 transition text-center"
            >
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Manage Tables</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">View QR codes</p>
            </Link>
            <Link
              href={`/${slug}/admin/waiters`}
              className="p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl hover:bg-gray-50 transition text-center"
            >
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-gray-900 mx-auto mb-2" />
              <p className="font-semibold text-gray-900 text-sm sm:text-base">Manage Waiters</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Add waiters</p>
            </Link>
          </div>
        </div>

        {/* Today's Orders - Mobile Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Today&apos;s Orders</h2>
          </div>
          <div className="overflow-x-auto">
            {todayOrdersList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders today</h3>
                <p className="text-sm sm:text-base text-gray-500">Orders will appear here when customers start ordering</p>
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Order #
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Table
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todayOrdersList.map(({ order, table }) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                        #{order.orderNumber}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                        {table?.tableNumber || 'N/A'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(parseFloat(order.totalAmount || '0'))}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
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

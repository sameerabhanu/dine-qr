import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, tables } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export default async function AllOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication and get restaurant
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin/orders`);

  const allOrders = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(eq(orders.restaurantId, restaurant.id))
    .orderBy(desc(orders.createdAt));

  const totalRevenue = allOrders.reduce(
    (sum, { order }) => sum + parseFloat(order.totalAmount || '0'),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${slug}/admin`}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Complete order history and analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{allOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(allOrders.length > 0 ? totalRevenue / allOrders.length : 0)}
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Order History</h2>
          </div>
          <div className="overflow-x-auto">
            {allOrders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500">
                  Orders will appear here once customers start ordering
                </p>
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
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allOrders.map(({ order, table }) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{order.id.substring(0, 8)}
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
                              : order.status === 'preparing'
                              ? 'bg-yellow-100 text-yellow-700'
                              : order.status === 'ready'
                              ? 'bg-blue-100 text-blue-700'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm') : '-'}
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

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, tables, orderItems } from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function CompletedOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin/orders/completed`);

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch completed orders from today
  const completedOrders = await db
    .select({
      order: orders,
      table: tables,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        eq(orders.status, 'completed'),
        gte(orders.completedAt, today)
      )
    )
    .orderBy(desc(orders.completedAt));

  // Calculate daily stats
  const totalRevenue = completedOrders.reduce(
    (sum, { order }) => sum + parseFloat(order.totalAmount || '0'),
    0
  );

  const paymentMethods = {
    cash: completedOrders.filter(({ order }) => order.paymentMethod === 'cash').length,
    card: completedOrders.filter(({ order }) => order.paymentMethod === 'card').length,
    upi: completedOrders.filter(({ order }) => order.paymentMethod === 'upi').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            href={`/${slug}/admin`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Completed Orders
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Today's completed orders and revenue
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{completedOrders.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Cash Payments</h3>
            <p className="text-3xl font-bold text-gray-900">{paymentMethods.cash}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Digital Payments</h3>
            <p className="text-3xl font-bold text-gray-900">{paymentMethods.card + paymentMethods.upi}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Orders List</h2>
          </div>
          
          {completedOrders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No completed orders yet today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      Waiter
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {completedOrders.map(({ order, table }) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Table {table?.tableNumber || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.waiterName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₹{parseFloat(order.totalAmount || '0').toFixed(0)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          order.paymentMethod === 'cash'
                            ? 'bg-green-100 text-green-700'
                            : order.paymentMethod === 'card'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {order.paymentMethod?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.completedAt
                          ? formatDistanceToNow(new Date(order.completedAt), { addSuffix: true })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

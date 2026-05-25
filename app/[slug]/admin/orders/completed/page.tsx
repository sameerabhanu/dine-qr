import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default async function CompletedOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin/orders/completed`);

  // Since orders are now auto-deleted on completion, we show order counts instead
  const todayCount = restaurant.todayOrdersCount || 0;
  const thisMonthCount = restaurant.currentMonthOrdersCount || 0;
  const lastMonthCount = restaurant.lastMonthOrdersCount || 0;

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
                Order Statistics
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View your order counts and trends
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Today's Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{todayCount}</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">This Month's Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{thisMonthCount}</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-900" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Last Month's Orders</h3>
            <p className="text-3xl font-bold text-gray-900">{lastMonthCount}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📊 Order Tracking System
          </h3>
          <p className="text-sm text-blue-800">
            Orders are automatically archived after completion to optimize database performance. 
            Only order counts are retained for reporting purposes. This ensures your system runs fast and efficiently.
          </p>
        </div>
      </div>
    </div>
  );
}

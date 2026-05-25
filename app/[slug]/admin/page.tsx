import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, orders, menuItems, categories, tables } from '@/lib/db/schema';
import { eq, desc, and, gte, count, lte } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import { startOfDay, startOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import { ChefHat, ShoppingBag, TrendingUp, Settings, Menu, Plus, Calendar } from 'lucide-react';

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
  const thisMonthStart = startOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  // Fetch statistics from restaurant table (already counted)
  const todayOrdersCount = restaurant.todayOrdersCount || 0;
  const thisMonthOrdersCount = restaurant.currentMonthOrdersCount || 0;
  const lastMonthOrdersCount = restaurant.lastMonthOrdersCount || 0;

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
        {/* Stats Grid - Three Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Today&apos;s Orders</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{todayOrdersCount}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">This Month&apos;s Orders</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{thisMonthOrdersCount}</p>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-gray-900" />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Last Month&apos;s Orders</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">{lastMonthOrdersCount}</p>
          </div>
        </div>

        {/* Quick Actions - Mobile Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
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
      </div>
    </div>
  );
}

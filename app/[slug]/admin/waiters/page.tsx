import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, Plus, UserCheck, UserX } from 'lucide-react';

export default async function WaitersManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication and get restaurant
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin/waiters`);

  // Fetch all waiters for this restaurant
  const waiters = await db
    .select()
    .from(staff)
    .where(
      and(
        eq(staff.restaurantId, restaurant.id),
        eq(staff.role, 'waiter')
      )
    )
    .orderBy(staff.createdAt);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <Link
            href={`/${slug}/admin`}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 hover:text-black transition group mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                Waiter Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
                Manage your restaurant's waiters
              </p>
            </div>
            <Link
              href={`/${slug}/admin/waiters/new`}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-base flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add Waiter</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {waiters.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
            <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No waiters added yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Add your first waiter to start managing orders</p>
            <Link
              href={`/${slug}/admin/waiters/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition font-medium text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              Add Waiter
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      PIN
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap hidden md:table-cell">
                      Last Login
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap hidden lg:table-cell">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waiters.map((waiter) => (
                    <tr key={waiter.id} className="hover:bg-gray-50 transition">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-700 font-semibold text-xs sm:text-base">
                              {waiter.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 text-xs sm:text-base truncate">{waiter.name}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span className="font-mono text-gray-900 text-xs sm:text-base">{waiter.accessCode}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {waiter.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <UserCheck className="w-3 h-3" />
                            <span className="hidden sm:inline">Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <UserX className="w-3 h-3" />
                            <span className="hidden sm:inline">Inactive</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap hidden md:table-cell">
                        {waiter.lastLoginAt
                          ? new Date(waiter.lastLoginAt).toLocaleString('en-IN')
                          : 'Never'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 whitespace-nowrap hidden lg:table-cell">
                        {waiter.createdAt
                          ? new Date(waiter.createdAt).toLocaleDateString('en-IN')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

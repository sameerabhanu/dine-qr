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
                Waiter Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your restaurant's waiters
              </p>
            </div>
            <Link
              href={`/${slug}/admin/waiters/new`}
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Waiter
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {waiters.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No waiters added yet</h3>
            <p className="text-gray-500 mb-6">Add your first waiter to start managing orders</p>
            <Link
              href={`/${slug}/admin/waiters/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Waiter
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      PIN
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waiters.map((waiter) => (
                    <tr key={waiter.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-700 font-semibold">
                              {waiter.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{waiter.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-gray-900">{waiter.accessCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        {waiter.isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <UserX className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {waiter.lastLoginAt
                          ? new Date(waiter.lastLoginAt).toLocaleString('en-IN')
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
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

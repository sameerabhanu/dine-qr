import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { restaurants, subscriptions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft, Building2, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default async function RestaurantsListPage() {
  const session = await auth();

  if (!session || session.user.userType !== 'super_admin') {
    redirect('/admin/login');
  }

  const allRestaurants = await db
    .select({
      restaurant: restaurants,
      subscription: subscriptions,
    })
    .from(restaurants)
    .leftJoin(subscriptions, eq(restaurants.id, subscriptions.restaurantId))
    .orderBy(desc(restaurants.createdAt));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Restaurants</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage all restaurant accounts
                </p>
              </div>
            </div>
            <Link
              href="/admin/restaurants/new"
              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Restaurant
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {allRestaurants.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No restaurants yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Add your first restaurant to get started
                </p>
                <Link
                  href="/admin/restaurants/new"
                  className="inline-flex px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Restaurant
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Restaurant
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Subscription
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allRestaurants.map(({ restaurant, subscription }) => (
                    <tr key={restaurant.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {restaurant.logoUrl ? (
                            <img
                              src={restaurant.logoUrl}
                              alt={restaurant.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">
                              {restaurant.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              /{restaurant.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{restaurant.email}</p>
                          <p className="text-gray-500">{restaurant.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {subscription ? (
                          <div className="text-sm">
                            <p className="text-gray-900 capitalize">
                              {subscription.status}
                            </p>
                            <p className="text-gray-500">
                              {subscription.currentPeriodEnd
                                ? `Until ${format(
                                    new Date(subscription.currentPeriodEnd),
                                    'MMM dd, yyyy'
                                  )}`
                                : 'Lifetime'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No subscription</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            restaurant.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {restaurant.createdAt ? format(new Date(restaurant.createdAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/${restaurant.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-black transition"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
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

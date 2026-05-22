import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';
import { Store, Users, Plus, LogOut, Menu, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import DeleteRestaurantButton from './DeleteRestaurantButton';

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session || session.user.userType !== 'super_admin') {
    redirect('/admin/login');
  }

  // Fetch statistics
  const [totalRestaurants] = await db.select({ count: count() }).from(restaurants);
  
  const [activeRestaurants] = await db
    .select({ count: count() })
    .from(restaurants)
    .where(eq(restaurants.isActive, true));

  // Fetch all restaurants (not just recent)
  const allRestaurants = await db
    .select({
      id: restaurants.id,
      name: restaurants.name,
      slug: restaurants.slug,
      email: restaurants.email,
      isActive: restaurants.isActive,
      createdAt: restaurants.createdAt,
    })
    .from(restaurants)
    .orderBy(restaurants.createdAt);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                <p className="text-xs text-gray-500">{session.user.email}</p>
              </div>
              <form action={async () => {
                'use server';
                const { signOut } = await import('@/auth');
                await signOut({ redirectTo: '/admin/login' });
              }}>
                <button
                  type="submit"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            icon={<Store className="w-5 h-5" />}
            label="Total Restaurants"
            value={totalRestaurants.count.toString()}
            subValue={`${activeRestaurants.count} active`}
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Active Restaurants"
            value={activeRestaurants.count.toString()}
            subValue="Currently subscribed"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin/restaurants/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium hover:shadow-xl hover:shadow-black/20"
          >
            <Plus className="w-5 h-5" />
            Add New Restaurant
          </Link>
        </div>

        {/* All Restaurants */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">All Restaurants</h2>
            <p className="text-sm text-gray-500 mt-1">Manage all restaurant accounts</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allRestaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{restaurant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-mono">/{restaurant.slug}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {restaurant.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurant.isActive
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {restaurant.createdAt?.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-4">
                        <Link
                          href={`/${restaurant.slug}`}
                          target="_blank"
                          className="text-gray-900 hover:text-blue-600 transition"
                          title="View restaurant page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <DeleteRestaurantButton 
                          restaurantId={restaurant.id} 
                          restaurantName={restaurant.name}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allRestaurants.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding your first restaurant</p>
              <Link
                href="/admin/restaurants/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Restaurant
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subValue}</p>
      </div>
    </div>
  );
}

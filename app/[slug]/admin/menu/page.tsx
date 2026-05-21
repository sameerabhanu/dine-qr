import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, menuItems, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function MenuManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication and get restaurant
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin/menu`);

  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id))
    .orderBy(categories.displayOrder);

  const allItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id))
    .orderBy(menuItems.displayOrder);

  const menuByCategory = allCategories.map(category => ({
    ...category,
    items: allItems.filter(item => item.categoryId === category.id),
  }));

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
                <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage categories and menu items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${slug}/admin/menu/categories/new`}
                className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </Link>
              <Link
                href={`/${slug}/admin/menu/items/new`}
                className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {menuByCategory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-6">Start by creating categories and adding menu items, or upload a CSV file</p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center gap-3">
                <Link
                  href={`/${slug}/admin/menu/categories/new`}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Add Category
                </Link>
                <Link
                  href={`/${slug}/admin/menu/items/new`}
                  className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium"
                >
                  Add Item
                </Link>
              </div>
              <div className="text-sm text-gray-500">or</div>
              <Link
                href={`/${slug}/admin/menu/upload`}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium inline-flex items-center gap-2"
              >
                Upload CSV File
              </Link>
              <a
                href="/CSV_UPLOAD_FORMAT.md"
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                View CSV format guide →
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {menuByCategory.map(category => (
              <div key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${slug}/admin/menu/categories/${category.id}/edit`}
                      className="p-2 hover:bg-gray-200 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                {category.items.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No items in this category
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {category.items.map(item => (
                      <div key={item.id} className="p-6 hover:bg-gray-50 transition">
                        <div className="flex gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {item.name}
                                  </h3>
                                  <span className="text-lg">
                                    {item.foodType === 'veg' && '🟢'}
                                    {item.foodType === 'egg' && '🟡'}
                                    {item.foodType === 'non-veg' && '🔴'}
                                  </span>
                                </div>
                              </div>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(parseFloat(item.price))}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span
                                className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                  item.isAvailable
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {item.foodType === 'non-veg' ? 'Non-Veg' : item.foodType}
                              </span>
                              <Link
                                href={`/${slug}/admin/menu/items/${item.id}/edit`}
                                className="text-sm text-gray-600 hover:text-black transition flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

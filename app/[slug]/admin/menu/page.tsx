import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, menuItems, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import MenuItemsList from './MenuItemsList';

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
          <MenuItemsList categories={menuByCategory} slug={slug} />
        )}
      </div>
    </div>
  );
}

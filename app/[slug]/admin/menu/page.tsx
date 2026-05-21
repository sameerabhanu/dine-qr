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
    items: allItems
      .filter(item => item.categoryId === category.id)
      .map(item => ({
        ...item,
        foodType: item.foodType as 'veg' | 'egg' | 'non-veg',
        isAvailable: item.isAvailable ?? true,
      })),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link
                href={`/${slug}/admin`}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Menu Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
                  Manage categories and menu items
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Link
                href={`/${slug}/admin/menu/categories/new`}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-900 rounded-lg sm:rounded-xl hover:bg-gray-200 transition font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">Cat</span>
              </Link>
              <Link
                href={`/${slug}/admin/menu/items/new`}
                className="px-2 sm:px-4 py-1.5 sm:py-2 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition font-medium flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Item</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {menuByCategory.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Start by creating categories and adding menu items, or upload a CSV file</p>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                <Link
                  href={`/${slug}/admin/menu/categories/new`}
                  className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-900 rounded-lg sm:rounded-xl hover:bg-gray-200 transition font-medium text-sm sm:text-base"
                >
                  Add Category
                </Link>
                <Link
                  href={`/${slug}/admin/menu/items/new`}
                  className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition font-medium text-sm sm:text-base"
                >
                  Add Item
                </Link>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">or</div>
              <Link
                href={`/${slug}/admin/menu/upload`}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition font-medium inline-flex items-center gap-2 text-sm sm:text-base"
              >
                Upload CSV File
              </Link>
              <a
                href="/CSV_UPLOAD_FORMAT.md"
                target="_blank"
                className="text-xs sm:text-sm text-blue-600 hover:underline"
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

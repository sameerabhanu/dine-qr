import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, tables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TablesClient from './TablesClient';

export default async function TablesManagementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Check authentication and get restaurant
  const { restaurant } = await requireRestaurantAuth(slug, `/${slug}/admin/tables`);

  const allTables = await db
    .select()
    .from(tables)
    .where(eq(tables.restaurantId, restaurant.id))
    .orderBy(tables.tableNumber);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link
                href={`/${slug}/admin`}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Table Management</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">
                  View and download QR codes for your tables
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <TablesClient initialTables={allTables} slug={slug} />
    </div>
  );
}

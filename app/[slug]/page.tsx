import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, menuItems, categories, tables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { QrCode, Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import OrderingInterface from './OrderingInterface';

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  // Await params and searchParams
  const { slug } = await params;
  const { table: tableQR } = await searchParams;

  // Fetch restaurant by slug
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);

  if (!restaurant) {
    notFound();
  }

  // Fetch table if QR code provided
  let table = null;
  if (tableQR) {
    const [foundTable] = await db
      .select()
      .from(tables)
      .where(eq(tables.qrCode, tableQR))
      .limit(1);
    table = foundTable || null;
  }

  // Fetch menu categories
  const menuCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id));

  // Fetch menu items
  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id));

  // Group items by category
  const menuByCategory = menuCategories.map(category => ({
    ...category,
    items: items.filter(item => item.categoryId === category.id && item.isAvailable),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{restaurant.name}</h1>
                {table && (
                  <p className="text-sm text-gray-500">Table {table.tableNumber}</p>
                )}
              </div>
            </div>
            {restaurant.phone && (
              <Link 
                href={`tel:${restaurant.phone}`}
                className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition"
                title="Call Restaurant"
              >
                <Phone className="w-5 h-5" />
              </Link>
            )}
          </div>
          
          {restaurant.address && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.address}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {!table && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Please scan the QR code on your table to start ordering.
            </p>
          </div>
        )}

        {menuByCategory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Coming Soon</h3>
            <p className="text-gray-500">
              We&apos;re preparing our menu. Please check back shortly.
            </p>
          </div>
        ) : (
          <OrderingInterface
            restaurant={restaurant}
            table={table}
            menuByCategory={menuByCategory}
          />
        )}
      </div>
    </div>
  );
}

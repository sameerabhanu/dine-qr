import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { restaurants, tables } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRestaurantAuth } from '@/lib/restaurant-auth';
import Link from 'next/link';
import { ArrowLeft, QrCode, Download } from 'lucide-react';

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
                <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                  View and download QR codes for your tables
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {allTables.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
            <p className="text-gray-500">
              Tables should have been created when your restaurant was set up.
              Contact support if you need assistance.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTables.map(table => (
              <div
                key={table.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition"
              >
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Table {table.tableNumber}
                  </h3>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      table.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {table.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${slug}?table=${table.qrCode}`
                    )}`}
                    alt={`QR Code for Table ${table.tableNumber}`}
                    className="w-full h-auto"
                  />
                </div>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${slug}?table=${table.qrCode}`
                  )}`}
                  download={`table-${table.tableNumber}-qr.png`}
                  className="w-full py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </a>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Scan URL: /{slug}?table={table.qrCode.slice(0, 8)}...
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

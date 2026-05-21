'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Download, Plus, Trash2 } from 'lucide-react';

type Table = {
  id: string;
  tableNumber: string;
  qrCode: string;
  isActive: boolean;
};

export default function TablesClient({
  initialTables,
  slug,
}: {
  initialTables: Table[];
  slug: string;
}) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [adding, setAdding] = useState(false);

  const handleDownloadQR = async (table: Table) => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/${slug}?table=${table.qrCode}`
    )}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table-${table.tableNumber}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code');
    }
  };

  const handleAddTable = async () => {
    setAdding(true);
    try {
      const response = await fetch(`/api/${slug}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to add table');
      }
    } catch (error) {
      alert('Error adding table');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteTable = async (tableId: string, tableNumber: string) => {
    if (!confirm(`Are you sure you want to delete Table ${tableNumber}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${slug}/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete table');
      }
    } catch (error) {
      alert('Error deleting table');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Add Table Button */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={handleAddTable}
          disabled={adding}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 text-sm sm:text-base disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {adding ? 'Adding...' : 'Add New Table'}
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
          <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tables found</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4">
            Add your first table to get started
          </p>
          <button
            onClick={handleAddTable}
            disabled={adding}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium inline-flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tables.map(table => (
            <div
              key={table.id}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="text-center flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Table {table.tableNumber}
                  </h3>
                  <span
                    className={`inline-flex px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                      table.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {table.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600 flex-shrink-0"
                  title="Delete Table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 mb-3 sm:mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/${slug}?table=${table.qrCode}`
                  )}`}
                  alt={`QR Code for Table ${table.tableNumber}`}
                  className="w-full h-auto"
                />
              </div>

              <button
                onClick={() => handleDownloadQR(table)}
                className="w-full py-2 sm:py-2.5 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition font-medium flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Download QR Code
              </button>

              <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3 break-all">
                Scan URL: /{slug}?table={table.qrCode.slice(0, 8)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

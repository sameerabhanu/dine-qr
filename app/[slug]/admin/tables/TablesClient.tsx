'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, Plus } from 'lucide-react';
import QRCode from 'qrcode';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

type Table = {
  id: string;
  tableNumber: string;
  qrCode: string;
  isActive: boolean | null;
  capacity: number | null;
  restaurantId: string;
  lastLoginAt?: Date | null;
  createdAt: Date | null;
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
  const [isAdding, setIsAdding] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleDownloadQR = async (table: Table) => {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(table.qrCode, {
        width: 512,
        margin: 2,
      });

      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `table-${table.tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to download QR code');
    }
  };

  const handleDelete = async (tableId: string, tableNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Table',
      message: `Are you sure you want to delete Table ${tableNumber}? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteLoadingId(tableId);
        try {
          const response = await fetch(`/api/${slug}/tables/${tableId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            // Optimistic update
            setTables(tables.filter(t => t.id !== tableId));
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            router.refresh();
          } else {
            const error = await response.json();
            alert(`Failed to delete table: ${error.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error deleting table:', error);
          alert('Error deleting table');
        } finally {
          setDeleteLoadingId(null);
        }
      },
    });
  };

  const handleAddTable = async () => {
    if (!newTableNumber.trim()) {
      alert('Please enter a table number');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/${slug}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: newTableNumber }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Optimistic update
        setTables([...tables, data.table]);
        setNewTableNumber('');
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to add table: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding table:', error);
      alert('Error adding table');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Add New Table - Single Line */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            type="text"
            placeholder="Table number (e.g., 1, 2, A1)"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            disabled={isAdding}
          />
          <button
            onClick={handleAddTable}
            disabled={isAdding}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {isAdding ? (
              <LoadingSpinner size="sm" className="border-white border-t-transparent" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isAdding ? 'Adding...' : 'Add Table'}</span>
          </button>
        </div>
      </div>

      {/* Tables List - Single Line Structure */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
        {tables.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No tables added yet. Add your first table above.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tables.map((table) => (
              <div
                key={table.id}
                className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Table Number */}
                  <div className="flex-shrink-0 w-12 sm:w-16">
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      Table {table.tableNumber}
                    </span>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 min-w-0" />

                  {/* Download QR Button */}
                  <button
                    onClick={() => handleDownloadQR(table)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-900 flex-shrink-0"
                    title="Download QR Code"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(table.id, table.tableNumber)}
                    disabled={deleteLoadingId === table.id}
                    className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-900 flex-shrink-0 disabled:opacity-50 flex items-center justify-center"
                    title="Delete Table"
                  >
                    {deleteLoadingId === table.id ? (
                      <LoadingSpinner size="sm" className="border-gray-900 border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        loading={deleteLoadingId !== null}
      />
    </div>
  );
}

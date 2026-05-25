'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Plus, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

type Table = {
  id: string;
  tableNumber: number;
  qrCode: string;
  isActive: boolean | null;
  restaurantId: string;
};

export default function TablesClient({
  initialTables,
  slug,
}: {
  initialTables: Table[];
  slug: string;
}) {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>(initialTables || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
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

  // Helper function to construct full QR URL
  const getFullQRUrl = (qrCode: string) => {
    // Use NEXT_PUBLIC_APP_URL from environment, fallback to production URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dineqr-scan.vercel.app';
    return `${baseUrl}/${slug}?table=${qrCode}`;
  };

  const handleDownloadQR = async (table: Table) => {
    setDownloadingId(table.id);
    try {
      const fullUrl = getFullQRUrl(table.qrCode);
      const qrCodeDataUrl = await QRCode.toDataURL(fullUrl, {
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
    } finally {
      setDownloadingId(null);
    }
  };

  const handleAddTable = async () => {
    setIsAdding(true);
    try {
      // Calculate next table number
      const maxTableNum = tables.reduce((max, t) => {
        const num = parseInt(t.tableNumber);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newTableNumber = (maxTableNum + 1).toString();

      const response = await fetch(`/api/${slug}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber: newTableNumber }),
        credentials: 'include',
      });

      if (response.ok) {
        const newTable = await response.json();
        // Update local state immediately
        setTables([...tables, newTable]);
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

  const handleDeleteLastTable = async () => {
    if (tables.length === 0) {
      alert('No tables to delete');
      return;
    }

    const lastTable = tables[tables.length - 1];
    
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Last Table',
      message: `Are you sure you want to delete Table ${lastTable.tableNumber}? This action cannot be undone.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const response = await fetch(`/api/${slug}/tables/${lastTable.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            setTables(tables.slice(0, -1));
            setConfirmDialog({ ...confirmDialog, isOpen: false });
          } else {
            const error = await response.json();
            alert(`Failed to delete table: ${error.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error deleting table:', error);
          alert('Error deleting table');
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={handleAddTable}
          disabled={isAdding}
          className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Table
            </>
          )}
        </button>
        
        <button
          onClick={handleDeleteLastTable}
          disabled={isDeleting || tables.length === 0}
          className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isDeleting ? (
            <>
              <LoadingSpinner size="sm" className="border-white border-t-transparent" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Last Table
            </>
          )}
        </button>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 text-sm mb-4">No tables added yet.</p>
          <button
            onClick={handleAddTable}
            disabled={isAdding}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.filter(table => table && table.id).map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center hover:shadow-lg transition"
            >
              {/* Table Number */}
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Table {table.tableNumber || 'N/A'}
              </h3>

              {/* QR Code */}
              <div className="w-full aspect-square bg-white rounded-lg mb-3 flex items-center justify-center border border-gray-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getFullQRUrl(table.qrCode || ''))}`}
                  alt={`QR Code for Table ${table.tableNumber}`}
                  className="w-full h-full object-contain p-2"
                />
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownloadQR(table)}
                disabled={downloadingId === table.id}
                className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloadingId === table.id ? (
                  <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {downloadingId === table.id ? 'Downloading...' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}

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
        loading={isDeleting}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Check, X, User, UserCheck, UserX } from 'lucide-react';

type Waiter = {
  id: string;
  name: string;
  accessCode: string | null;
  isActive: boolean | null;
  email: string | null;
  passwordHash: string | null;
  role: string;
  restaurantId: string;
  lastLoginAt: Date | null;
  createdAt: Date | null;
};

export default function WaitersClient({
  initialWaiters,
  slug,
}: {
  initialWaiters: Waiter[];
  slug: string;
}) {
  const router = useRouter();
  const [waiters, setWaiters] = useState(initialWaiters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; accessCode: string }>({
    name: '',
    accessCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleEdit = (waiter: Waiter) => {
    setEditingId(waiter.id);
    setEditData({ name: waiter.name, accessCode: waiter.accessCode ?? '' });
  };

  const handleSave = async (waiterId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${slug}/waiters/${waiterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          accessCode: editData.accessCode,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        // Optimistic update
        setWaiters(waiters.map(w => 
          w.id === waiterId 
            ? { ...w, name: editData.name, accessCode: editData.accessCode } 
            : w
        ));
        setEditingId(null);
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to update waiter: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating waiter:', error);
      alert('Error updating waiter');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (waiterId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/${slug}/waiters/${waiterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        // Optimistic update
        setWaiters(waiters.map(w => 
          w.id === waiterId 
            ? { ...w, isActive: !currentStatus } 
            : w
        ));
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to toggle status: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error toggling status');
    }
  };

  const handleDelete = async (waiterId: string, waiterName: string) => {
    if (!confirm(`Are you sure you want to delete ${waiterName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${slug}/waiters/${waiterId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Optimistic update
        setWaiters(waiters.filter(w => w.id !== waiterId));
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to delete waiter: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting waiter:', error);
      alert('Error deleting waiter');
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {waiters.map((waiter) => (
          <div key={waiter.id} className="px-3 sm:px-6 py-2 sm:py-3 hover:bg-gray-50 transition">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Avatar/Icon */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
              </div>

              {/* Name - Editable */}
              {editingId === waiter.id ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
              ) : (
                <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {waiter.name}
                </span>
              )}

              {/* PIN - Editable */}
              {editingId === waiter.id ? (
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={editData.accessCode}
                  onChange={(e) => setEditData({ ...editData, accessCode: e.target.value.replace(/\D/g, '') })}
                  className="w-14 sm:w-16 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black text-center"
                />
              ) : (
                <span className="w-14 sm:w-16 flex-shrink-0 text-xs sm:text-sm font-mono text-gray-900 text-center">
                  {waiter.accessCode ?? '----'}
                </span>
              )}

              {/* Status Toggle */}
              <button
                onClick={() => handleToggleStatus(waiter.id, waiter.isActive ?? true)}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  waiter.isActive ?? true ? 'bg-green-600' : 'bg-gray-200'
                }`}
                disabled={editingId === waiter.id}
                title={waiter.isActive ?? true ? 'Active' : 'Inactive'}
              >
                <span
                  className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    waiter.isActive ?? true ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              {/* Edit / Save / Cancel */}
              {editingId === waiter.id ? (
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleSave(waiter.id)}
                    disabled={loading}
                    className="p-1 sm:p-1.5 hover:bg-green-100 rounded-lg transition text-green-600"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={loading}
                    className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEdit(waiter)}
                  className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600 flex-shrink-0"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => handleDelete(waiter.id, waiter.name)}
                className="p-1 sm:p-1.5 hover:bg-red-100 rounded-lg transition text-red-600 flex-shrink-0"
                title="Delete"
                disabled={editingId === waiter.id}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

type FoodType = 'veg' | 'egg' | 'non-veg';

interface MenuItem {
  id: string;
  name: string;
  price: string;
  foodType: FoodType;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

const FoodTypeIcon = ({ type }: { type: FoodType }) => {
  if (type === 'veg') {
    return (
      <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center rounded-sm">
        <div className="w-2 h-2 rounded-full bg-green-600"></div>
      </div>
    );
  }
  if (type === 'egg') {
    return (
      <div className="w-4 h-4 border-2 border-orange-500 flex items-center justify-center rounded-sm">
        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
      </div>
    );
  }
  return (
    <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center rounded-sm">
      <div className="w-2 h-2 rounded-full bg-red-600"></div>
    </div>
  );
};

export default function MenuItemsList({
  categories,
  slug,
}: {
  categories: Category[];
  slug: string;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; price: string }>({ name: '', price: '' });
  const [loading, setLoading] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);
  
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

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditData({ name: item.name, price: item.price });
  };

  const handleSave = async (itemId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/${slug}/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          price: editData.price,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to update item: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Error updating item');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setToggleLoadingId(itemId);
    try {
      const response = await fetch(`/api/${slug}/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAvailable: !currentStatus,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(`Failed to toggle availability: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      alert('Error toggling availability');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/${slug}/menu/items/${itemId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            router.refresh();
          } else {
            const error = await response.json();
            alert(`Failed to delete item: ${error.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error deleting item:', error);
          alert('Error deleting item');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${categoryName}" and all its items? This action cannot be undone.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/${slug}/menu/categories/${categoryId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            setConfirmDialog({ ...confirmDialog, isOpen: false });
            router.refresh();
          } else {
            const error = await response.json();
            alert(`Failed to delete category: ${error.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('Error deleting category:', error);
          alert('Error deleting category');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {categories.map(category => (
        <div key={category.id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">{category.name}</h2>
            <button
              onClick={() => handleDeleteCategory(category.id, category.name)}
              className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition text-red-600"
              title="Delete Category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {category.items.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-gray-500 text-xs sm:text-sm">
              No items in this category
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {category.items.map(item => (
                <div key={item.id} className="px-3 sm:px-6 py-2 sm:py-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Food Type Icon */}
                    <div className="flex-shrink-0">
                      <FoodTypeIcon type={item.foodType} />
                    </div>

                    {/* Name - Editable */}
                    {editingId === item.id ? (
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </span>
                    )}

                    {/* Price - Editable */}
                    {editingId === item.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editData.price}
                        onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                        className="w-16 sm:w-24 px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    ) : (
                      <span className="w-16 sm:w-24 flex-shrink-0 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                        ₹{parseFloat(item.price).toFixed(0)}
                      </span>
                    )}

                    {/* Toggle Availability */}
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        item.isAvailable ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                      disabled={editingId === item.id || toggleLoadingId === item.id}
                    >
                      {toggleLoadingId === item.id ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                        </div>
                      ) : (
                        <span
                          className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            item.isAvailable ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      )}
                    </button>

                    {/* Edit / Save / Cancel */}
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSave(item.id)}
                          disabled={loading}
                          className="p-1 sm:p-1.5 hover:bg-green-100 rounded-lg transition text-green-600 disabled:opacity-50 flex items-center justify-center"
                          title="Save"
                        >
                          {loading ? (
                            <LoadingSpinner size="sm" className="border-green-600 border-t-transparent" />
                          ) : (
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
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
                        onClick={() => handleEdit(item)}
                        className="p-1 sm:p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600 flex-shrink-0"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1 sm:p-1.5 hover:bg-red-100 rounded-lg transition text-red-600 flex-shrink-0"
                      title="Delete"
                      disabled={editingId === item.id}
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
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
      loading={loading}
    />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, X } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: string;
  categoryId: string;
  isAvailable: boolean;
  foodType: string;
  displayOrder: number;
}

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const itemId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    isAvailable: true,
    foodType: 'veg' as 'veg' | 'egg' | 'non-veg',
    displayOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchMenuItem();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/${slug}/menu/categories`);
      const data = await response.json();
      if (response.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMenuItem = async () => {
    try {
      const response = await fetch(`/api/${slug}/menu/items/${itemId}`);
      const data = await response.json();
      
      if (response.ok && data.item) {
        setMenuItem(data.item);
        setFormData({
          name: data.item.name,
          price: data.item.price,
          categoryId: data.item.categoryId,
          isAvailable: data.item.isAvailable,
          foodType: data.item.foodType || 'veg',
          displayOrder: data.item.displayOrder,
        });
      } else {
        setError('Menu item not found');
      }
    } catch (error) {
      setError('Failed to load menu item');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'displayOrder' ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, imageUrl: url }));
    setImagePreview(url);
  };

  const clearImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/${slug}/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update menu item');
      }

      router.push(`/${slug}/admin/menu`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/${slug}/menu/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete menu item');
      }

      router.push(`/${slug}/admin/menu`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item';
      setError(errorMessage);
      setDeleting(false);
    }
  };

  if (!menuItem && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={`/${slug}/admin/menu`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Menu
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item</h1>
              <p className="text-sm text-gray-500 mt-1">Update item details</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Item Details</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Item Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="e.g., Margherita Pizza"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                    placeholder="299.00"
                  />
                </div>

                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-900 mb-2">
                    Category *
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-900 mb-2">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleImageUrlChange}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                    placeholder="https://example.com/image.jpg"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-40 h-40 rounded-xl object-cover border border-gray-200"
                      onError={() => {
                        setImagePreview('');
                        setError('Invalid image URL');
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-900 mb-2">
                    Display Order
                  </label>
                  <input
                    id="displayOrder"
                    name="displayOrder"
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  />
                </div>

                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="isVeg"
                    name="isVeg"
                    type="checkbox"
                    checked={formData.isVeg}
                    onChange={handleInputChange}
                    className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-black"
                  />
                  <label htmlFor="isVeg" className="text-sm font-medium text-gray-900">
                    Vegetarian
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-8">
                  <input
                    id="isAvailable"
                    name="isAvailable"
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    className="w-5 h-5 border-gray-300 rounded focus:ring-2 focus:ring-black"
                  />
                  <label htmlFor="isAvailable" className="text-sm font-medium text-gray-900">
                    Available
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Menu Item'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

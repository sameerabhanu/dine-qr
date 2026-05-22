'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category {
  id: string;
  name: string;
}

export default function NewMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    foodType: 'veg' as 'veg' | 'egg' | 'non-veg',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setFetchingCategories(true);
    try {
      const response = await fetch(`/api/${slug}/menu/categories`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok && data.categories) {
        setCategories(data.categories);
        if (data.categories.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.categoryId) return;
    
    setLoading(true);

    try {
      const response = await fetch(`/api/${slug}/menu/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          isAvailable: true,
          displayOrder: 0,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create menu item');
        return;
      }

      router.push(`/${slug}/admin/menu`);
    } catch (error: unknown) {
      console.error('Error creating menu item:', error);
      alert('Failed to create menu item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <Link
            href={`/${slug}/admin/menu`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-black transition mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </Link>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Add Menu Item</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {fetchingCategories ? (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-8 text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-sm text-yellow-800 mb-3">
              Please create at least one category first.
            </p>
            <Link
              href={`/${slug}/admin/menu/categories/new`}
              className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium text-sm"
            >
              Add Category
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Item Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  placeholder="e.g., Paneer Butter Masala"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
                    Price (₹)
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    placeholder="299"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="foodType" className="block text-sm font-medium text-gray-900 mb-2">
                    Type
                  </label>
                  <select
                    id="foodType"
                    required
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value as 'veg' | 'egg' | 'non-veg' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    disabled={loading}
                  >
                    <option value="veg">Veg</option>
                    <option value="egg">Egg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-900 mb-2">
                  Category
                </label>
                <select
                  id="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  disabled={loading}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" className="border-white border-t-transparent" />}
                  {loading ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

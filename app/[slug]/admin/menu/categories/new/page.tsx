'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function NewCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);

    try {
      const response = await fetch(`/api/${slug}/menu/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), displayOrder: 0 }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to create category');
        return;
      }

      router.push(`/${slug}/admin/menu`);
    } catch (error: unknown) {
      console.error('Error creating category:', error);
      alert('Failed to create category');
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
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Add Category</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                Category Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                placeholder="e.g., Starters, Main Course, Desserts"
                disabled={loading}
              />
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
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 font-medium text-sm flex items-center justify-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" className="border-white border-t-transparent" />}
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

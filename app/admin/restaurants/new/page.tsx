'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Store } from 'lucide-react';
import Link from 'next/link';

export default function NewRestaurantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    email: '',
    address: '',
    numberOfTables: 10,
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    ownerName: '',
    accessCode: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create restaurant');
      }

      // Success! Redirect to restaurant details
      router.push(`/admin`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create restaurant';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Restaurant</h1>
              <p className="text-sm text-gray-500 mt-1">Onboard a new restaurant in minutes</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Restaurant Information */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Restaurant Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Restaurant Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="Pizza Palace"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-2">
                  URL Slug *
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition font-mono text-sm"
                  placeholder="pizza-palace"
                />
                <p className="text-xs text-gray-500 mt-2">
                  URL: <span className="font-mono">dineqr.app/{formData.slug || 'slug'}</span>
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Restaurant Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="contact@pizzapalace.com"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                  placeholder="123 Main Street, Mumbai, Maharashtra 400001"
                />
              </div>
            </div>
          </div>

          {/* Setup Configuration */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Setup Configuration</h2>
            
            <div>
              <label htmlFor="numberOfTables" className="block text-sm font-medium text-gray-900 mb-2">
                Number of Tables *
              </label>
              <input
                id="numberOfTables"
                name="numberOfTables"
                type="number"
                min="1"
                max="100"
                required
                value={formData.numberOfTables}
                onChange={handleInputChange}
                className="w-full md:w-48 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-2">
                QR codes will be generated for each table
              </p>
            </div>
          </div>

          {/* Owner Account */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Owner Account</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ownerName" className="block text-sm font-medium text-gray-900 mb-2">
                  Owner Name *
                </label>
                <input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-900 mb-2">
                  4-Digit Access Code *
                </label>
                <input
                  id="accessCode"
                  name="accessCode"
                  type="text"
                  required
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={formData.accessCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition font-mono text-2xl tracking-widest text-center"
                  placeholder="1234"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Owner will use this code to access their admin panel
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
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
              className="flex-1 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-black/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Restaurant...
                </>
              ) : (
                'Create Restaurant'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

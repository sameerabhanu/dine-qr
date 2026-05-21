'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewWaiterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pin' ? value.replace(/\D/g, '').slice(0, 4) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!/^\d{4}$/.test(formData.pin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      const response = await fetch(`/api/${slug}/waiters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add waiter');
      }

      router.push(`/${slug}/admin/waiters`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add waiter';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href={`/${slug}/admin/waiters`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition group mb-4"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Waiters
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Waiter</h1>
          <p className="text-sm text-gray-500 mt-1">Create a new waiter account</p>
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
            <h2 className="text-lg font-bold text-gray-900 mb-6">Waiter Details</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Waiter Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                  placeholder="e.g., Ram Kumar"
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-900 mb-2">
                  4-Digit PIN *
                </label>
                <input
                  id="pin"
                  name="pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  value={formData.pin}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition font-mono text-2xl tracking-widest"
                  placeholder="****"
                />
                <p className="text-xs text-gray-500 mt-2">
                  This PIN will be used by the waiter to login to their dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/${slug}/admin/waiters`}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name || formData.pin.length !== 4}
              className="flex-1 py-3 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Waiter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

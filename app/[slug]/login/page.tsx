'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Lock, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function RestaurantLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState<string>('');

  // Unwrap params on client side
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate access code format
      if (!/^\d{4}$/.test(accessCode)) {
        setError('Access code must be 4 digits');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/${slug}/auth/access-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid access code');
        setLoading(false);
        return;
      }

      // Access code is valid, redirect to admin
      const redirect = searchParams.get('redirect') || `/${slug}/admin`;
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Admin</h1>
          <p className="text-gray-600">Enter your 4-digit access code</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="accessCode"
                className="block text-sm font-semibold text-gray-900 mb-3 text-center"
              >
                Access Code
              </label>
              <input
                id="accessCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition font-mono text-3xl tracking-[1em] text-center"
                placeholder="****"
                autoComplete="off"
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center mt-3">
                Enter the 4-digit code provided by the platform admin
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || accessCode.length !== 4}
              className="w-full py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href={slug ? `/${slug}` : '/'}
            className="text-sm text-gray-600 hover:text-black transition inline-flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode } from 'lucide-react';

export default function GenericLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DineQR</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
          <p className="text-gray-600 mb-8">
            Please select how you want to sign in
          </p>

          <div className="space-y-4">
            <Link
              href="/admin/login"
              className="block w-full py-4 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition font-semibold"
            >
              Platform Admin
            </Link>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Restaurant owners should go to their specific login page:
              <br />
              <span className="font-mono text-xs">dineqr.com/your-restaurant/login</span>
            </div>
          </div>
        </div>

        <Link href="/" className="text-sm text-gray-600 hover:text-black transition">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, DollarSign, CheckCircle, AlertCircle, XCircle, 
  RefreshCw, Clock, Building2, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ConfirmDialog';
import LoadingSpinner from '@/components/LoadingSpinner';

type Restaurant = any;
type FilterType = 'all' | 'active' | 'expiring_soon' | 'expired' | 'suspended';

export default function SubscriptionsClient({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Restaurant | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<Restaurant | null>(null);
  const [showConfirm, setShowConfirm] = useState<{restaurant: Restaurant; action: string} | null>(null);
  const [paymentData, setPaymentData] = useState({
    amount: '1000',
    date: new Date().toISOString().split('T')[0],
    method: 'upi',
  });
  const [extendDays, setExtendDays] = useState('30');

  // Filter restaurants
  const filteredRestaurants = restaurants.filter(r => {
    if (filter === 'all') return true;
    return r.subscriptionStatus === filter;
  });

  // Count by status
  const counts = {
    all: restaurants.length,
    active: restaurants.filter(r => r.subscriptionStatus === 'active').length,
    expiring_soon: restaurants.filter(r => r.subscriptionStatus === 'expiring_soon').length,
    expired: restaurants.filter(r => r.subscriptionStatus === 'expired').length,
    suspended: restaurants.filter(r => r.subscriptionStatus === 'suspended').length,
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active', icon: CheckCircle },
      expiring_soon: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Expiring Soon', icon: AlertCircle },
      expired: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Expired', icon: Clock },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended', icon: XCircle },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive', icon: XCircle },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.inactive;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const handleMarkPaid = async () => {
    if (!showPaymentModal) return;
    
    setActionLoading(showPaymentModal.id);
    try {
      const response = await fetch(`/api/admin/subscriptions/${showPaymentModal.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentData.amount),
          date: new Date(paymentData.date),
          extensionMonths: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to mark as paid'}`);
        return;
      }

      setShowPaymentModal(null);
      router.refresh();
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async () => {
    if (!showExtendModal) return;
    
    setActionLoading(showExtendModal.id);
    try {
      const response = await fetch(`/api/admin/subscriptions/${showExtendModal.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: parseInt(extendDays) }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to extend subscription'}`);
        return;
      }

      setShowExtendModal(null);
      router.refresh();
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspension = async (restaurant: Restaurant, suspend: boolean) => {
    setActionLoading(restaurant.id);
    try {
      const response = await fetch(`/api/admin/subscriptions/${restaurant.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          suspend,
          reason: suspend ? 'Manual suspension by admin' : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to update status'}`);
        return;
      }

      setShowConfirm(null);
      router.refresh();
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-3 font-medium">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-gray-600 mt-2">Manage restaurant subscriptions and payments</p>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                window.location.reload();
              }}
              disabled={loading}
              className="px-4 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50 font-semibold shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'active', label: 'Active', count: counts.active },
            { key: 'expiring_soon', label: 'Expiring Soon', count: counts.expiring_soon },
            { key: 'expired', label: 'Expired', count: counts.expired },
            { key: 'suspended', label: 'Suspended', count: counts.suspended },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterType)}
              className={`px-5 py-2.5 rounded-xl transition whitespace-nowrap font-semibold ${
                filter === key
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Restaurant List */}
        <div className="mt-6 space-y-4">
          {filteredRestaurants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No restaurants found in this category</p>
            </div>
          ) : (
            filteredRestaurants.map(restaurant => (
              <div key={restaurant.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                      {getStatusBadge(restaurant.subscriptionStatus || 'active')}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {restaurant.subscriptionExpiresAt && (
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <p className="font-medium text-gray-900">
                            {new Date(restaurant.subscriptionExpiresAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      )}
                      {restaurant.phone && (
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium text-gray-900">{restaurant.phone}</p>
                        </div>
                      )}
                      {restaurant.email && (
                        <div>
                          <span className="text-gray-500">Email:</span>
                          <p className="font-medium text-gray-900 truncate">{restaurant.email}</p>
                        </div>
                      )}
                      {restaurant.lastPaymentDate && (
                        <div>
                          <span className="text-gray-500">Last Payment:</span>
                          <p className="font-medium text-gray-900">
                            ₹{restaurant.lastPaymentAmount || '0'} ({new Date(restaurant.lastPaymentDate).toLocaleDateString('en-IN')})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowPaymentModal(restaurant)}
                    disabled={actionLoading === restaurant.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                  >
                    {actionLoading === restaurant.id ? <LoadingSpinner size="sm" /> : 'Mark as Paid'}
                  </button>
                  
                  <button
                    onClick={() => setShowExtendModal(restaurant)}
                    disabled={actionLoading === restaurant.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Extend
                  </button>
                  
                  {restaurant.subscriptionStatus === 'suspended' ? (
                    <button
                      onClick={() => setShowConfirm({ restaurant, action: 'reactivate' })}
                      disabled={actionLoading === restaurant.id}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                    >
                      Reactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirm({ restaurant, action: 'suspend' })}
                      disabled={actionLoading === restaurant.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                      Suspend
                    </button>
                  )}

                  <Link
                    href={`/${restaurant.slug}/admin`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    View Dashboard
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Mark as Paid</h2>
            <p className="text-gray-600 mb-6">Recording payment for <strong>{showPaymentModal.name}</strong></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleMarkPaid}
                  disabled={actionLoading === showPaymentModal.id}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
                >
                  {actionLoading === showPaymentModal.id ? 'Processing...' : 'Confirm Payment'}
                </button>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Extend Subscription</h2>
            <p className="text-gray-600 mb-6">Extending subscription for <strong>{showExtendModal.name}</strong></p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Extend by (days)</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  placeholder="30"
                />
                <p className="text-sm text-gray-500 mt-2">Common: 30 days (1 month), 90 days (3 months)</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExtend}
                  disabled={actionLoading === showExtendModal.id}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                >
                  {actionLoading === showExtendModal.id ? 'Processing...' : 'Extend'}
                </button>
                <button
                  onClick={() => setShowExtendModal(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          isOpen={!!showConfirm}
          title={showConfirm.action === 'suspend' ? 'Suspend Restaurant' : 'Reactivate Restaurant'}
          message={
            showConfirm.action === 'suspend'
              ? `Are you sure you want to suspend "${showConfirm.restaurant.name}"?\n\nThis will:\n- Block all logins (admin & waiters)\n- Disable customer ordering\n- Show "unavailable" on QR scans`
              : `Reactivate "${showConfirm.restaurant.name}"?\n\nThis will restore access based on their subscription status.`
          }
          confirmText={showConfirm.action === 'suspend' ? 'Suspend' : 'Reactivate'}
          onConfirm={() => handleToggleSuspension(showConfirm.restaurant, showConfirm.action === 'suspend')}
          onCancel={() => setShowConfirm(null)}
        />
      )}
    </>
  );
}

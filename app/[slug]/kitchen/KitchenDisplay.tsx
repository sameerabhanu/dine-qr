'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Order = {
  id: string;
  status: string | null;
  createdAt: Date | null;
  table: any;
  items: Array<{
    id: string;
    quantity: number;
    notes: string | null;
    menuItem: any;
  }>;
};

export default function KitchenDisplay({
  restaurant,
  orders: initialOrders,
}: {
  restaurant: any;
  orders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      window.location.reload();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev =>
          prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-700 border-gray-300';
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ready':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusAction = (status: string | null, orderId: string) => {
    if (!status) return null;
    switch (status) {
      case 'pending':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'preparing')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
          >
            Start Preparing
          </button>
        );
      case 'preparing':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'ready')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Mark Ready
          </button>
        );
      case 'ready':
        return (
          <button
            onClick={() => updateOrderStatus(orderId, 'completed')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Complete Order
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Kitchen Display</h1>
                <p className="text-sm text-gray-500">{restaurant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'pending'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('preparing')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'preparing'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Preparing ({orders.filter(o => o.status === 'preparing').length})
              </button>
              <button
                onClick={() => setFilter('ready')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'ready'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ready ({orders.filter(o => o.status === 'ready').length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-500">
              All orders are completed. New orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition"
              >
                {/* Order Header */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      #{order.id.substring(0, 8)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Table {order.table?.tableNumber || 'N/A'}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                        }) : 'Unknown time'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4 space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-bold flex-shrink-0">
                        {item.quantity}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">
                          {item.menuItem?.name || 'Unknown Item'}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  {getStatusAction(order.status, order.id)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

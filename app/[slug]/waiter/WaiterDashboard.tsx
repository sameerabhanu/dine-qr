'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, LogOut, AlertCircle, CheckCircle, Loader2, ShoppingBag, QrCode, User, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type OrderItem = {
  id: string;
  menuItemName: string;
  quantity: number;
  priceAtOrder: string;
  subtotal: string;
  notes?: string | null;
};

type Order = {
  order: any;
  table: any;
  items: OrderItem[];
};

export default function WaiterDashboard({
  restaurant,
  waiter,
  pendingOrders: initialPending,
  myOrders: initialMy,
  slug,
}: {
  restaurant: any;
  waiter: any;
  pendingOrders: Order[];
  myOrders: Order[];
  slug: string;
}) {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState(initialPending);
  const [myOrders, setMyOrders] = useState(initialMy);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Update state when server data changes
  useEffect(() => {
    setPendingOrders(initialPending);
    setMyOrders(initialMy);
  }, [initialPending, initialMy]);

  // Initialize Supabase Realtime subscription
  useEffect(() => {
    console.log('🔄 Setting up Supabase Realtime...');

    // Subscribe to orders table changes for this restaurant
    const ordersChannel = supabase
      .channel(`orders:${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          console.log('📥 New order created:', payload);
          // Refresh the page to get the new order with all its data
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          console.log('📝 Order updated:', payload);
          const updatedOrder = payload.new as any;
          
          // Handle order claim by another waiter
          if (updatedOrder.waiter_id && updatedOrder.waiter_id !== waiter.id && updatedOrder.status === 'preparing') {
            // Remove from pending orders
            setPendingOrders(prev => prev.filter(o => o.order.id !== updatedOrder.id));
          }
          
          // Handle order completion
          if (updatedOrder.status === 'completed') {
            // Remove from my orders if completed
            setMyOrders(prev => prev.filter(o => o.order.id !== updatedOrder.id));
            setPendingOrders(prev => prev.filter(o => o.order.id !== updatedOrder.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connected');
        }
      });

    setChannel(ordersChannel);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up Realtime subscription');
      ordersChannel.unsubscribe();
    };
  }, [restaurant.id, waiter.id, router]);

  const handleLogout = async () => {
    try {
      await fetch(`/api/${slug}/waiter/logout`, {
        method: 'POST',
      });
      router.push(`/${slug}/waiter-login`);
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleClaimOrder = async (orderId: string) => {
    setClaimingId(orderId);
    setError('');

    // OPTIMISTIC UPDATE - Remove immediately from UI
    const orderToMove = pendingOrders.find(o => o.order.id === orderId);
    setPendingOrders(prev => prev.filter(o => o.order.id !== orderId));
    
    // Add to my orders optimistically
    if (orderToMove) {
      setMyOrders(prev => [{
        ...orderToMove,
        order: { ...orderToMove.order, status: 'claimed', claimedAt: new Date() }
      }, ...prev]);
    }

    try {
      const response = await fetch(`/api/${slug}/orders/${orderId}/claim`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        // ROLLBACK on error
        if (orderToMove) {
          setPendingOrders(prev => [...prev, orderToMove]);
          setMyOrders(prev => prev.filter(o => o.order.id !== orderId));
        }
        
        if (response.status === 409) {
          setError('This order was just claimed by another waiter');
        } else {
          setError(data.error || 'Failed to claim order');
        }
        setClaimingId(null);
        return;
      }

      // Success - polling will sync any differences
    } catch (err) {
      // ROLLBACK on error
      if (orderToMove) {
        setPendingOrders(prev => [...prev, orderToMove]);
        setMyOrders(prev => prev.filter(o => o.order.id !== orderId));
      }
      setError('Network error. Please try again.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/${slug}/orders/${orderId}/invoice`);
      const data = await response.json();
      
      if (response.ok) {
        setInvoiceData(data.invoice);
        setShowInvoice(orderId);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    }
  };

  const handleCompleteOrder = async (orderId: string, paymentMethod: string) => {
    setCompletingId(orderId);
    setError('');

    // OPTIMISTIC UPDATE - Remove immediately from UI
    setMyOrders(prev => prev.filter(o => o.order.id !== orderId));
    setShowInvoice(null);

    try {
      const response = await fetch(`/api/${slug}/orders/${orderId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ROLLBACK on error - polling will restore the order
        setError(data.error || 'Failed to complete order');
        setCompletingId(null);
        return;
      }

      // Success - polling will keep state in sync
    } catch (err) {
      // ROLLBACK on error - polling will restore the order
      setError('Network error. Please try again.');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{restaurant.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-3.5 h-3.5" />
                  <span>{waiter.name}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Pending Orders Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Orders ({pendingOrders.length})
          </h2>
          
          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-500">No pending orders at the moment</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingOrders.map(({ order, table, items }) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Table {table?.tableNumber || 'N/A'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Just now'}
                        </span>
                        {order.createdAt && Date.now() - new Date(order.createdAt).getTime() > 10 * 60 * 1000 && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(order.totalAmount || '0').toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {items && items.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-gray-700" />
                        <h4 className="font-semibold text-gray-900">Order Items</h4>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-gray-900 font-medium">
                                {item.quantity}x {item.menuItemName}
                              </span>
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-1">Note: {item.notes}</p>
                              )}
                            </div>
                            <span className="text-gray-700 font-medium ml-4">
                              ₹{parseFloat(item.subtotal).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.specialInstructions && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Note:</span> {order.specialInstructions}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleClaimOrder(order.id)}
                    disabled={claimingId === order.id}
                    className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {claimingId === order.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      'Accept Order'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Orders Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            My Orders ({myOrders.length})
          </h2>
          
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">You have no orders in progress</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myOrders.map(({ order, table, items }) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border-2 border-green-200 p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          Table {table?.tableNumber || 'N/A'}
                        </h3>
                        <span className="text-sm text-gray-500">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Claimed {order.claimedAt ? formatDistanceToNow(new Date(order.claimedAt), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">
                        ₹{parseFloat(order.totalAmount || '0').toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  {items && items.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-gray-700" />
                        <h4 className="font-semibold text-gray-900">Order Items</h4>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="text-gray-900 font-medium">
                                {item.quantity}x {item.menuItemName}
                              </span>
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-1">Note: {item.notes}</p>
                              )}
                            </div>
                            <span className="text-gray-700 font-medium ml-4">
                              ₹{parseFloat(item.subtotal).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.specialInstructions && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">Note:</span> {order.specialInstructions}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handleCompleteOrder(order.id, 'cash')}
                    disabled={completingId === order.id}
                    className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {completingId === order.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Mark as Completed
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice Modal */}
        {showInvoice && invoiceData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
                  <button
                    onClick={() => setShowInvoice(null)}
                    className="text-gray-500 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Restaurant Info */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="font-bold text-lg">{invoiceData.restaurant?.name}</h3>
                  <p className="text-sm text-gray-600">{invoiceData.restaurant?.address}</p>
                  <p className="text-sm text-gray-600">{invoiceData.restaurant?.phone}</p>
                </div>

                {/* Order Info */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Order #:</span>
                    <span className="font-semibold">{invoiceData.order?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Table:</span>
                    <span className="font-semibold">{invoiceData.table?.tableNumber}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="font-semibold mb-3">Items</h4>
                  <div className="space-y-2">
                    {invoiceData.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.menuItemName}</span>
                        <span>₹{parseFloat(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>₹{invoiceData.billing?.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (5%):</span>
                    <span>₹{invoiceData.billing?.gst}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Charge (10%):</span>
                    <span>₹{invoiceData.billing?.serviceCharge}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-gray-300">
                    <span>Total:</span>
                    <span>₹{invoiceData.billing?.total}</span>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleCompleteOrder(showInvoice, 'cash')}
                    disabled={completingId === showInvoice}
                    className="py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold disabled:opacity-50 text-sm"
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => handleCompleteOrder(showInvoice, 'card')}
                    disabled={completingId === showInvoice}
                    className="py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold disabled:opacity-50 text-sm"
                  >
                    Card
                  </button>
                  <button
                    onClick={() => handleCompleteOrder(showInvoice, 'upi')}
                    disabled={completingId === showInvoice}
                    className="py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-semibold disabled:opacity-50 text-sm"
                  >
                    UPI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type OrderItem = {
  id: string;
  menuItemName: string;
  quantity: number;
  priceAtOrder: string;
  subtotal: string;
};

type PendingPaymentOrder = {
  order: any;
  table: any;
  waiter: any;
  items: OrderItem[];
};

type GroupedTable = {
  tableId: string;
  tableNumber: number;
  waiter: any;
  orders: PendingPaymentOrder[];
  totalAmount: number;
  orderingFeesTotal: number;
  grandTotal: number;
  earliestOrderTime: string;
};

export default function AdminDashboardClient({
  restaurant,
  slug,
  initialPendingPayments,
}: {
  restaurant: any;
  slug: string;
  initialPendingPayments: PendingPaymentOrder[];
}) {
  const router = useRouter();
  const [pendingPayments, setPendingPayments] = useState(initialPendingPayments);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Group orders by table
  const groupedByTable = pendingPayments.reduce((acc, paymentData) => {
    const tableId = paymentData.table?.id || 'no-table';
    const tableNumber = paymentData.table?.tableNumber || 0;
    
    if (!acc[tableId]) {
      acc[tableId] = {
        tableId,
        tableNumber,
        waiter: paymentData.waiter,
        orders: [],
        totalAmount: 0,
        orderingFeesTotal: 0,
        grandTotal: 0,
        earliestOrderTime: paymentData.order.createdAt,
      };
    }
    
    acc[tableId].orders.push(paymentData);
    const orderAmount = parseFloat(paymentData.order.totalAmount || '0');
    const orderFee = parseFloat(paymentData.order.orderingFee || '0');
    
    acc[tableId].totalAmount += orderAmount;
    acc[tableId].orderingFeesTotal += orderFee;
    acc[tableId].grandTotal += (orderAmount + orderFee);
    
    // Track earliest order time
    if (paymentData.order.createdAt < acc[tableId].earliestOrderTime) {
      acc[tableId].earliestOrderTime = paymentData.order.createdAt;
    }
    
    return acc;
  }, {} as Record<string, GroupedTable>);

  const groupedTablesArray = Object.values(groupedByTable);

  // Set up realtime subscription
  useEffect(() => {
    console.log('🔄 Admin: Setting up Supabase Realtime...');

    const ordersChannel = supabase
      .channel(`admin-orders:${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        async (payload) => {
          const newOrder = payload.new as any;
          
          // Only show orders with payment_collected status
          if (newOrder.status === 'payment_collected') {
            console.log('📥 Admin: New payment to confirm:', newOrder);
            
            // Fetch full order details with items
            try {
              const response = await fetch(`/api/${slug}/orders/${newOrder.id}/details`);
              if (response.ok) {
                const data = await response.json();
                
                // Add to pending payments list
                setPendingPayments(prev => {
                  // Avoid duplicates
                  if (prev.find(p => p.order.id === newOrder.id)) return prev;
                  return [...prev, data.order];
                });
              }
            } catch (error) {
              console.error('Failed to fetch new order details:', error);
            }
          }
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
        async (payload) => {
          const updatedOrder = payload.new as any;
          
          // Add to list if status changed to payment_collected
          if (updatedOrder.status === 'payment_collected') {
            console.log('📥 Admin: Payment collected for order:', updatedOrder);
            
            // Fetch full order details with items
            try {
              const response = await fetch(`/api/${slug}/orders/${updatedOrder.id}/details`);
              if (response.ok) {
                const data = await response.json();
                
                // Add to pending payments list
                setPendingPayments(prev => {
                  // Avoid duplicates
                  if (prev.find(p => p.order.id === updatedOrder.id)) return prev;
                  return [...prev, data.order];
                });
              }
            } catch (error) {
              console.error('Failed to fetch order details:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const deletedOrderId = payload.old.id;
          console.log('🗑️ Admin: Order deleted:', deletedOrderId);
          
          // Remove from pending payments list
          setPendingPayments(prev => 
            prev.filter(p => p.order.id !== deletedOrderId)
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Admin subscription status:', status);
      });

    return () => {
      console.log('🔌 Admin: Cleaning up Realtime subscription');
      ordersChannel.unsubscribe();
    };
  }, [restaurant.id, router, slug]);

  const handleConfirmTablePayment = async (tableId: string, orderIds: string[]) => {
    setConfirmingId(tableId);
    setError('');

    try {
      // Confirm all orders for this table
      const confirmPromises = orderIds.map(orderId =>
        fetch(`/api/${slug}/orders/${orderId}/confirm-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const responses = await Promise.all(confirmPromises);
      const data = await Promise.all(responses.map(r => r.json()));

      // Check if any failed
      const failedResponse = responses.find(r => !r.ok);
      if (failedResponse) {
        const failedData = data[responses.indexOf(failedResponse)];
        setError(failedData.error || 'Failed to confirm payment');
        setConfirmingId(null);
        return;
      }

      // Optimistically remove all orders for this table from UI
      setPendingPayments(prev => prev.filter(p => p.table?.id !== tableId));
      console.log('✅ Payment confirmed for table:', tableId);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  };

  if (groupedTablesArray.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 sm:mb-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Pending Payment Confirmations ({groupedTablesArray.length} {groupedTablesArray.length === 1 ? 'Table' : 'Tables'})
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {groupedTablesArray.map((tableData) => {
            // Combine all items from all orders
            const allItems: Record<string, { quantity: number; priceAtOrder: number; subtotal: number }> = {};
            tableData.orders.forEach(order => {
              order.items.forEach(item => {
                if (!allItems[item.menuItemName]) {
                  allItems[item.menuItemName] = {
                    quantity: 0,
                    priceAtOrder: parseFloat(item.priceAtOrder),
                    subtotal: 0,
                  };
                }
                allItems[item.menuItemName].quantity += item.quantity;
                allItems[item.menuItemName].subtotal += parseFloat(item.subtotal);
              });
            });

            return (
              <div
                key={tableData.tableId}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                        Table {tableData.tableNumber}
                      </h3>
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        {tableData.orders.length} {tableData.orders.length === 1 ? 'Order' : 'Orders'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Waiter: {tableData.waiter?.name || 'Unknown'} • {' '}
                      {formatDistanceToNow(new Date(tableData.earliestOrderTime), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      ₹{tableData.grandTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      + ₹{tableData.orderingFeesTotal.toFixed(2)} fee
                    </p>
                  </div>
                </div>

                {/* Combined Order Items */}
                <div className="mb-3 space-y-1">
                  {Object.entries(allItems).map(([itemName, itemData]) => (
                    <div key={itemName} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {itemData.quantity}x {itemName}
                      </span>
                      <span className="text-gray-900 font-medium">
                        ₹{itemData.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Confirm Button */}
                <button
                  onClick={() => handleConfirmTablePayment(
                    tableData.tableId,
                    tableData.orders.map(o => o.order.id)
                  )}
                  disabled={confirmingId === tableData.tableId}
                  className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {confirmingId === tableData.tableId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Payment Received
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

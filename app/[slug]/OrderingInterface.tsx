'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, X, Check, Phone } from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  price: string;
  foodType: string;
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
  customizations: Record<string, string>;
  notes: string;
};

export default function OrderingInterface({
  restaurant,
  table,
  menuByCategory,
}: {
  restaurant: any;
  table: any;
  menuByCategory: Category[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<{ items: CartItem[], total: number } | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(['veg', 'egg', 'non-veg']));

  // Get quantity of item in cart
  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(ci => ci.menuItem.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Toggle food filter
  const toggleFilter = (type: string) => {
    setSelectedFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return newFilters;
    });
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(
        ci => ci.menuItem.id === item.id && Object.keys(ci.customizations).length === 0
      );
      if (existing) {
        return prev.map(ci =>
          ci === existing ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1, customizations: {}, notes: '' }];
    });
  };

  const decrementItem = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menuItem.id === item.id);
      if (existing) {
        if (existing.quantity === 1) {
          return prev.filter(ci => ci.menuItem.id !== item.id);
        }
        return prev.map(ci =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity - 1 } : ci
        );
      }
      return prev;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev =>
      prev.map((item, i) => {
        if (i === index) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      return sum + parseFloat(item.menuItem.price) * item.quantity;
    }, 0);
  };

  const placeOrder = async () => {
    if (!table) {
      alert('Please scan a table QR code to place an order');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Save order details and show success immediately (optimistic)
    const orderDetails = {
      items: [...cart],
      total: calculateTotal()
    };
    
    setPlacedOrderDetails(orderDetails);
    setOrderPlaced(true);
    const tempCart = [...cart];
    setCart([]);
    
    setLoading(true);

    // Place order in background
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          tableId: table.id,
          items: tempCart.map(item => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            customizations: item.customizations,
            notes: item.notes,
          })),
        }),
      });

      if (!response.ok) {
        // Rollback on error
        setOrderPlaced(false);
        setPlacedOrderDetails(null);
        setCart(tempCart);
        throw new Error('Failed to place order');
      }

      // Order placed successfully
    } catch (error) {
      alert('Failed to place order. Please try again.');
      setOrderPlaced(false);
      setPlacedOrderDetails(null);
      setCart(tempCart);
    } finally {
      setLoading(false);
    }
  };

  // Filter menu items based on selected filter
  const filterItems = (items: MenuItem[]) => {
    if (selectedFilters.size === 0) return [];
    return items.filter(item => selectedFilters.has(item.foodType));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Food type icon component
  const FoodTypeIcon = ({ type, size = 'default' }: { type: string; size?: 'default' | 'large' }) => {
    const sizeClasses = size === 'large' ? 'w-6 h-6' : 'w-5 h-5';
    const dotClasses = size === 'large' ? 'w-3 h-3' : 'w-2.5 h-2.5';
    
    if (type === 'veg') {
      return (
        <div className={`${sizeClasses} border-2 border-green-600 rounded flex items-center justify-center`}>
          <div className={`${dotClasses} rounded-full bg-green-600`}></div>
        </div>
      );
    }
    if (type === 'egg') {
      return (
        <div className={`${sizeClasses} border-2 border-yellow-600 rounded flex items-center justify-center`}>
          <div className={`${dotClasses} rounded-full bg-yellow-600`}></div>
        </div>
      );
    }
    if (type === 'non-veg') {
      return (
        <div className={`${sizeClasses} border-2 border-red-600 rounded flex items-center justify-center`}>
          <div className={`${dotClasses} rounded-full bg-red-600`}></div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Filter Toggles */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex items-center gap-6 justify-center">
          {/* Veg Toggle */}
          <button
            onClick={() => toggleFilter('veg')}
            className="flex items-center gap-3"
          >
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                selectedFilters.has('veg') ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform flex items-center justify-center ${
                  selectedFilters.has('veg') ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <FoodTypeIcon type="veg" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Veg</span>
          </button>

          {/* Egg Toggle */}
          <button
            onClick={() => toggleFilter('egg')}
            className="flex items-center gap-3"
          >
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                selectedFilters.has('egg') ? 'bg-yellow-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform flex items-center justify-center ${
                  selectedFilters.has('egg') ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <FoodTypeIcon type="egg" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Egg</span>
          </button>

          {/* Non-Veg Toggle */}
          <button
            onClick={() => toggleFilter('non-veg')}
            className="flex items-center gap-3"
          >
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                selectedFilters.has('non-veg') ? 'bg-red-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform flex items-center justify-center ${
                  selectedFilters.has('non-veg') ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <FoodTypeIcon type="non-veg" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700">Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-8 pb-24 px-6 pt-6">
        {menuByCategory.map(category => {
          const filteredItems = filterItems(category.items);
          return filteredItems.length > 0 && (
            <div key={category.id}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {category.name}
              </h2>
              <div className="grid gap-4">
                {filteredItems.map(item => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition"
                    >
                      <div className="flex gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FoodTypeIcon type={item.foodType} />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.name}
                            </h3>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{parseFloat(item.price).toFixed(0)}
                            </span>
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                disabled={!table}
                                className="w-[100px] h-[38px] bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <Plus className="w-4 h-4" />
                                Add
                              </button>
                            ) : (
                              <div className="w-[100px] h-[38px] flex items-center justify-center bg-black text-white rounded-lg px-1.5">
                                <button
                                  onClick={() => decrementItem(item)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-800 rounded transition flex-shrink-0"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-sm flex-1 text-center">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-800 rounded transition flex-shrink-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Button */}
      {table && cartItemCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl hover:bg-gray-800 transition flex items-center gap-3 z-40"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-semibold">{cartItemCount} items</span>
          <span className="font-bold">₹{calculateTotal().toFixed(0)}</span>
        </button>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {orderPlaced ? 'Order Placed!' : 'Your Order'}
              </h2>
              <button
                onClick={() => {
                  setShowCart(false);
                  setOrderPlaced(false);
                  setPlacedOrderDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message */}
            {orderPlaced && placedOrderDetails && (
              <div className="p-6 bg-green-50 border-b border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 text-lg">Order Confirmed!</p>
                    <p className="text-sm text-green-700">Your order has been sent to the kitchen</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {orderPlaced && placedOrderDetails ? (
                // Show placed order items
                placedOrderDetails.items.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FoodTypeIcon type={item.menuItem.foodType} />
                        <h3 className="font-semibold text-gray-900">
                          {item.menuItem.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        ₹{parseFloat(item.menuItem.price).toFixed(0)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                // Show current cart items
                cart.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FoodTypeIcon type={item.menuItem.foodType} />
                        <h3 className="font-semibold text-gray-900">
                          {item.menuItem.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        ₹{parseFloat(item.menuItem.price).toFixed(0)} each
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(index, -1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 mb-2">
                        ₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(0)}
                      </p>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 space-y-4">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900 text-2xl">
                  ₹{orderPlaced && placedOrderDetails ? placedOrderDetails.total.toFixed(0) : calculateTotal().toFixed(0)}
                </span>
              </div>
              {orderPlaced ? (
                <button
                  onClick={() => {
                    setShowCart(false);
                    setOrderPlaced(false);
                    setPlacedOrderDetails(null);
                  }}
                  className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Done
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="w-full py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

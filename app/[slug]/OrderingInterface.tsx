'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, X, Check, Phone } from 'lucide-react';
import { ORDERING_FEE, CURRENCY } from '@/lib/config';

type MenuItem = {
  id: string;
  name: string;
  price: string;
  foodType: string | null;
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

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      return sum + parseFloat(item.menuItem.price) * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + ORDERING_FEE;
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
    return items.filter(item => item.foodType && selectedFilters.has(item.foodType));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Food type icon component
  const FoodTypeIcon = ({ type, size = 'default' }: { type: string | null; size?: 'default' | 'large' | 'toggle' }) => {
    let sizeClasses, dotClasses, borderRadius;
    
    if (size === 'toggle') {
      // Smaller icon for toggle switches
      sizeClasses = 'w-3 h-3 sm:w-3.5 sm:h-3.5';
      dotClasses = 'w-1.5 h-1.5';
      borderRadius = 'rounded-sm'; // Less radius
    } else if (size === 'large') {
      sizeClasses = 'w-6 h-6';
      dotClasses = 'w-3 h-3';
      borderRadius = 'rounded';
    } else {
      sizeClasses = 'w-4 h-4 sm:w-5 sm:h-5';
      dotClasses = 'w-2 h-2 sm:w-2.5 sm:h-2.5';
      borderRadius = 'rounded-sm';
    }
    
    if (type === 'veg') {
      return (
        <div className={`${sizeClasses} border-2 border-green-600 ${borderRadius} flex items-center justify-center`}>
          <div className={`${dotClasses} rounded-full bg-green-600`}></div>
        </div>
      );
    }
    if (type === 'egg') {
      return (
        <div className={`${sizeClasses} border-2 border-yellow-600 ${borderRadius} flex items-center justify-center`}>
          <div className={`${dotClasses} rounded-full bg-yellow-600`}></div>
        </div>
      );
    }
    if (type === 'non-veg') {
      return (
        <div className={`${sizeClasses} border-2 border-red-600 ${borderRadius} flex items-center justify-center`}>
          <div className={`${dotClasses} rounded-full bg-red-600`}></div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Filter Toggles - Mobile Responsive */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 py-3 sm:py-4 px-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6 justify-center flex-wrap">
          {/* Veg Toggle */}
          <button
            onClick={() => toggleFilter('veg')}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div
              className={`relative w-10 sm:w-11 h-5 sm:h-6 rounded-lg transition-colors ${
                selectedFilters.has('veg') ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-md transition-transform flex items-center justify-center ${
                  selectedFilters.has('veg') ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <FoodTypeIcon type="veg" size="toggle" />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Veg</span>
          </button>

          {/* Egg Toggle */}
          <button
            onClick={() => toggleFilter('egg')}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div
              className={`relative w-10 sm:w-11 h-5 sm:h-6 rounded-lg transition-colors ${
                selectedFilters.has('egg') ? 'bg-yellow-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-md transition-transform flex items-center justify-center ${
                  selectedFilters.has('egg') ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <FoodTypeIcon type="egg" size="toggle" />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Egg</span>
          </button>

          {/* Non-Veg Toggle */}
          <button
            onClick={() => toggleFilter('non-veg')}
            className="flex items-center gap-2 sm:gap-3"
          >
            <div
              className={`relative w-10 sm:w-11 h-5 sm:h-6 rounded-lg transition-colors ${
                selectedFilters.has('non-veg') ? 'bg-red-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-md transition-transform flex items-center justify-center ${
                  selectedFilters.has('non-veg') ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                <FoodTypeIcon type="non-veg" size="toggle" />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-700">Non-Veg</span>
          </button>
        </div>
      </div>

      {/* Menu - Single Line Compact Structure */}
      <div className="space-y-4 sm:space-y-6 pb-24 px-3 sm:px-6 pt-4 sm:pt-6">
        {menuByCategory.map(category => {
          const filteredItems = filterItems(category.items);
          return filteredItems.length > 0 && (
            <div key={category.id} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {category.name}
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredItems.map(item => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="px-3 sm:px-6 py-2 sm:py-3 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Food Type Icon */}
                        <div className="flex-shrink-0">
                          <FoodTypeIcon type={item.foodType} />
                        </div>

                        {/* Item Name */}
                        <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </span>

                        {/* Price */}
                        <span className="w-16 sm:w-20 flex-shrink-0 text-xs sm:text-sm font-semibold text-gray-900 text-right">
                          ₹{parseFloat(item.price).toFixed(0)}
                        </span>

                        {/* Add/Quantity Controls */}
                        {quantity === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!table}
                            className="w-16 sm:w-20 h-7 sm:h-8 bg-black text-white rounded-lg hover:bg-gray-800 transition text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 flex-shrink-0"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        ) : (
                          <div className="w-16 sm:w-20 h-7 sm:h-8 flex items-center justify-between bg-black text-white rounded-lg px-1 flex-shrink-0">
                            <button
                              onClick={() => decrementItem(item)}
                              className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-gray-800 rounded transition"
                            >
                              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <span className="font-semibold text-xs sm:text-sm">
                              {quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-gray-800 rounded transition"
                            >
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Button - Mobile Responsive */}
      {table && cartItemCount > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 bg-black text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl hover:bg-gray-800 transition flex items-center gap-2 sm:gap-3 z-40"
        >
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-semibold text-xs sm:text-base">{cartItemCount} <span className="hidden sm:inline">items</span></span>
          <span className="font-bold text-xs sm:text-base">{CURRENCY.symbol}{calculateTotal().toFixed(0)}</span>
        </button>
      )}

      {/* Cart Modal - Compact Design */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header - Compact */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                {orderPlaced ? 'Order Placed!' : 'Your Order'}
              </h2>
              <button
                onClick={() => {
                  setShowCart(false);
                  setOrderPlaced(false);
                  setPlacedOrderDetails(null);
                }}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Success Message - Compact */}
            {orderPlaced && placedOrderDetails && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-green-50 border-b border-green-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-green-900 text-sm sm:text-base">Order Confirmed!</p>
                    <p className="text-xs sm:text-sm text-green-700">Your order has been sent to the kitchen</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Items - Single Line Compact Structure */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="divide-y divide-gray-200">
                {orderPlaced && placedOrderDetails ? (
                  // Show placed order items - Compact
                  placedOrderDetails.items.map((item, index) => (
                    <div key={index} className="py-2 sm:py-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FoodTypeIcon type={item.menuItem.foodType} />
                        <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {item.menuItem.name}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                          ×{item.quantity}
                        </span>
                        <span className="w-16 sm:w-20 text-xs sm:text-sm font-semibold text-gray-900 text-right flex-shrink-0">
                          ₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  // Show current cart items - Compact with controls
                  cart.map((item, index) => (
                    <div key={index} className="py-2 sm:py-2.5">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <FoodTypeIcon type={item.menuItem.foodType} />
                        <span className="flex-1 min-w-0 text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {item.menuItem.name}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                          @₹{parseFloat(item.menuItem.price).toFixed(0)}
                        </span>
                        
                        {/* Quantity Controls - Compact */}
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-md flex items-center justify-center hover:bg-gray-200 transition"
                          >
                            <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <span className="font-semibold text-gray-900 w-5 sm:w-6 text-center text-xs sm:text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-md flex items-center justify-center hover:bg-gray-200 transition"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                        
                        <span className="w-12 sm:w-16 text-xs sm:text-sm font-semibold text-gray-900 text-right flex-shrink-0">
                          ₹{(parseFloat(item.menuItem.price) * item.quantity).toFixed(0)}
                        </span>
                        
                        <button
                          onClick={() => removeFromCart(index)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                          title="Remove"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer - Compact */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 space-y-3 sm:space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-gray-600">
                <span className="text-sm sm:text-base">Subtotal</span>
                <span className="font-medium text-sm sm:text-base">
                  {CURRENCY.symbol}{orderPlaced && placedOrderDetails ? (placedOrderDetails.total - ORDERING_FEE).toFixed(0) : calculateSubtotal().toFixed(0)}
                </span>
              </div>
              
              {/* Ordering Fee */}
              <div className="flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base">Digital Ordering Fee</span>
                  <a
                    href="/why-ordering-fee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Why?
                  </a>
                </div>
                <span className="font-medium text-sm sm:text-base">
                  {CURRENCY.symbol}{ORDERING_FEE.toFixed(0)}
                </span>
              </div>
              
              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900 text-sm sm:text-base">Total</span>
                <span className="font-bold text-gray-900 text-lg sm:text-xl">
                  {CURRENCY.symbol}{orderPlaced && placedOrderDetails ? placedOrderDetails.total.toFixed(0) : calculateTotal().toFixed(0)}
                </span>
              </div>
              {orderPlaced ? (
                <button
                  onClick={() => {
                    setShowCart(false);
                    setOrderPlaced(false);
                    setPlacedOrderDetails(null);
                  }}
                  className="w-full py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  Done
                </button>
              ) : (
                <button
                  onClick={placeOrder}
                  disabled={loading}
                  className="w-full py-2.5 sm:py-3 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-800 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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

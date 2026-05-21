import { nanoid } from 'nanoid';

/**
 * Generate a unique QR code string
 */
export function generateQRCode(): string {
  return `QR-${nanoid(12)}`;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Generate a unique slug from restaurant name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount: number | string, currency: string = 'INR'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (currency === 'INR') {
    return `₹${num.toFixed(2)}`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Calculate order total from items
 */
export function calculateOrderTotal(items: Array<{ priceAtOrder: string | number; quantity: number }>): string {
  const total = items.reduce((sum, item) => {
    const price = typeof item.priceAtOrder === 'string' ? parseFloat(item.priceAtOrder) : item.priceAtOrder;
    return sum + (price * item.quantity);
  }, 0);
  
  return total.toFixed(2);
}

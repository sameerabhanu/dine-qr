/**
 * Business Configuration
 * Update these values to change across the entire app
 */

// Digital Ordering Fee (in rupees)
export const ORDERING_FEE = 3;

// Agency Information (for monthly reports)
export const AGENCY_INFO = {
  name: 'DineQR',
  location: 'India',
  contact: '+91-8333027544',
  reportEmail: 'ramvanumu07@gmail.com', // Where to send monthly reports
};

// Brand Information
export const BRAND_INFO = {
  name: 'DineQR',
  adminEmail: 'ramvanumu07@gmail.com',
  adminPhone: '+91-8333027544',
};

// Currency
export const CURRENCY = {
  symbol: '₹',
  code: 'INR',
};

// Notification Settings
export const NOTIFICATION_SETTINGS = {
  enableWaiterNotifications: true,
  notificationTitle: 'New Order Received! 🔔',
  notificationBody: 'A new order has been placed.',
};

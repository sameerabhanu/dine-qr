// Service Worker for DineQR Waiter App
// Handles background notifications for new orders

const CACHE_NAME = 'dineqr-waiter-v1';
const NOTIFICATION_TAG = 'new-order';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    clients.claim() // Take control of all clients immediately
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data);
  
  if (event.data.type === 'NEW_ORDER') {
    // Show notification
    const { orderNumber, tableNumber, totalAmount } = event.data.payload;
    
    showNotification({
      title: '🔔 New Order!',
      body: `Order #${orderNumber} from Table ${tableNumber}\nAmount: ${totalAmount}`,
      tag: NOTIFICATION_TAG,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'open', title: 'View Order' }
      ]
    });
    
    // Play sound in background (if supported)
    playNotificationSound();
  }
  
  if (event.data.type === 'PING') {
    // Keep-alive ping
    event.ports[0].postMessage({ type: 'PONG' });
  }
});

// Show notification
async function showNotification(options) {
  try {
    const registration = await self.registration;
    await registration.showNotification(options.title, {
      body: options.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [200, 100, 200],
      actions: options.actions || [],
      data: options.data || {},
      silent: false
    });
    console.log('Service Worker: Notification shown');
  } catch (error) {
    console.error('Service Worker: Failed to show notification', error);
  }
}

// Play notification sound (using notification API)
async function playNotificationSound() {
  try {
    // Send message to all clients to play sound
    const allClients = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    for (const client of allClients) {
      client.postMessage({
        type: 'PLAY_SOUND'
      });
    }
  } catch (error) {
    console.error('Service Worker: Failed to trigger sound', error);
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open or focus the waiter page
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if waiter page is already open
        for (const client of clientList) {
          if (client.url.includes('/waiter') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not found
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle push events (for future expansion)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (event.data) {
    try {
      const data = event.data.json();
      event.waitUntil(
        showNotification({
          title: data.title || 'New Order',
          body: data.body || 'You have a new order',
          tag: NOTIFICATION_TAG,
          requireInteraction: true,
          data: data
        })
      );
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
    }
  }
});

console.log('Service Worker: Loaded and ready');

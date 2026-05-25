# PWA & Background Notifications Setup

## Overview
The waiter app now supports Progressive Web App (PWA) features with background notifications. Waiters will receive sound notifications for new orders even when:
- The app is minimized
- They're using other apps
- The phone screen is locked (on some devices)

## Features Implemented

### 1. Service Worker (`public/sw.js`)
- Handles background notifications
- Manages notification display with vibration
- Sends messages to active clients to play sound
- Handles notification clicks (opens/focuses waiter page)

### 2. PWA Manifest (`public/manifest.json`)
- Defines app name, icons, colors
- Enables "Add to Home Screen" on mobile
- Makes the app work standalone (fullscreen mode)

### 3. Waiter Dashboard Enhancements
- Service Worker registration on load
- Notification permission request button (bell icon)
- Automatic notification sending on new orders
- Sound playback through Service Worker messaging

### 4. App Icons
- Created simple SVG icons (192x192 and 512x512)
- Black background with food emoji
- Works on all devices

## How It Works

### For Waiters (User Experience)
1. Open the waiter login page on mobile
2. Click the **bell icon** in the header to enable notifications
3. Accept the notification permission when prompted
4. Add the app to home screen for best experience:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen
5. New orders will trigger:
   - Push notification (even when app is in background)
   - Vibration pattern
   - Sound (when app is active or in background)

### Technical Flow
1. **Page Load**: Service Worker registers (`/sw.js`)
2. **User Action**: Waiter clicks bell icon → permission requested
3. **New Order Arrives**: Supabase Realtime triggers
4. **Notification Sent**: 
   - Message sent to Service Worker
   - Service Worker shows notification
   - Service Worker tells client to play sound
   - Client plays beep (if active)
5. **Background**: Notification shows even if app is not visible

## Files Added/Modified

### New Files
- `public/manifest.json` - PWA manifest
- `public/sw.js` - Service Worker
- `public/icon-192.svg` - App icon (small)
- `public/icon-512.svg` - App icon (large)
- `PWA_README.md` - This file

### Modified Files
- `app/layout.tsx` - Added PWA meta tags
- `app/[slug]/waiter/WaiterDashboard.tsx` - Added Service Worker logic

## Testing

### Desktop (for development)
1. Open Chrome/Edge
2. Go to waiter page
3. Open DevTools → Application → Service Workers
4. Verify Service Worker is registered
5. Test notification permission

### Mobile (production testing)
1. Deploy to Vercel
2. Open waiter page on mobile browser
3. Click bell icon to enable notifications
4. Add to home screen
5. Minimize app
6. Create test order from customer page
7. Verify notification appears + sound plays

## Browser Compatibility

### Full Support (PWA + Background Notifications)
- ✅ Chrome/Edge Android 89+
- ✅ Chrome/Edge Desktop
- ✅ Firefox Android 96+
- ✅ Samsung Internet 15+

### Partial Support (PWA, limited background)
- ⚠️ iOS Safari 16.4+ (notifications work when app is active, limited in background)
- ⚠️ iOS Chrome/Firefox (uses Safari engine, same limitations)

### No Background Support
- ❌ iOS Safari < 16.4
- ❌ Desktop Safari

## Configuration

### Service Worker Updates
To modify notification behavior, edit `public/sw.js`:
- Change vibration pattern: `vibrate: [200, 100, 200]`
- Change notification text format
- Add notification actions (buttons)

### PWA Branding
To customize app appearance, edit `public/manifest.json`:
- Update `name` and `short_name`
- Change `theme_color` and `background_color`
- Replace icon files

## Known Limitations

1. **iOS Background**: iOS heavily restricts background notifications for web apps
   - Best experience: Add to Home Screen
   - Notification permissions reset after ~7 days of inactivity
   
2. **Battery Optimization**: Some Android devices may kill Service Workers to save battery
   - Solution: Ask waiters to disable battery optimization for the browser

3. **Sound in Background**: Sound may not play on all devices when app is backgrounded
   - Notification with vibration will always work
   - Sound plays reliably when app is active

## Troubleshooting

### Notifications not showing
1. Check notification permission (bell icon should be green)
2. Open DevTools → Application → Service Workers (ensure registered)
3. Check browser console for errors

### Service Worker not updating
1. Go to DevTools → Application → Service Workers
2. Click "Unregister"
3. Refresh page
4. Service Worker will re-register with latest code

### Sound not playing in background
- Expected on iOS (limitation)
- Vibration + notification will still work
- For best results, keep app active/visible

## Future Enhancements

Potential improvements:
- Push notifications via server (Firebase Cloud Messaging)
- Better iOS support (when Apple adds more PWA features)
- Custom sound files (currently uses Web Audio API beeps)
- Notification grouping (show count of pending orders)
- Offline support (cache menu, work without internet)

## Support

For issues or questions about PWA features:
1. Check browser console for errors
2. Verify Service Worker is registered
3. Test on different devices/browsers
4. Clear browser cache and retry

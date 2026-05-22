import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { eq, and, lte, gte, or } from 'drizzle-orm';

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'inactive';

/**
 * Check if a restaurant's subscription is valid (active or expiring_soon)
 */
export function isSubscriptionValid(status: string | null): boolean {
  return status === 'active' || status === 'expiring_soon';
}

/**
 * Check if a restaurant is suspended or inactive
 */
export function isRestaurantBlocked(status: string | null): boolean {
  return status === 'suspended' || status === 'inactive';
}

/**
 * Calculate subscription status based on expiry date
 */
export function calculateSubscriptionStatus(expiresAt: Date | null, gracePeriodDays: number = 2): SubscriptionStatus {
  if (!expiresAt) {
    return 'active'; // No expiry set, consider active
  }

  const now = new Date();
  const expiryDate = new Date(expiresAt);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Check if already past grace period
  if (daysUntilExpiry < -gracePeriodDays) {
    return 'suspended'; // Auto-suspended after grace period
  }

  // Check if in grace period (expired but within grace period)
  if (daysUntilExpiry < 0) {
    return 'expired'; // Grace period active
  }

  // Check if expiring soon (within 3 days)
  if (daysUntilExpiry <= 3) {
    return 'expiring_soon';
  }

  return 'active';
}

/**
 * Update subscription status for a single restaurant
 */
export async function updateRestaurantSubscriptionStatus(restaurantId: string) {
  try {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const newStatus = calculateSubscriptionStatus(
      restaurant.subscriptionExpiresAt,
      restaurant.gracePeriodDays || 2
    );

    // Only update if status changed
    if (newStatus !== restaurant.subscriptionStatus) {
      const updateData: any = {
        subscriptionStatus: newStatus,
        updatedAt: new Date(),
      };

      // If newly suspended, set suspended timestamp
      if (newStatus === 'suspended' && !restaurant.suspendedAt) {
        updateData.suspendedAt = new Date();
        updateData.suspensionReason = 'Automatic suspension due to subscription expiry';
      }

      // If reactivated (moved from suspended to active), clear suspension data
      if (newStatus === 'active' && restaurant.suspendedAt) {
        updateData.suspendedAt = null;
        updateData.suspensionReason = null;
      }

      await db
        .update(restaurants)
        .set(updateData)
        .where(eq(restaurants.id, restaurantId));

      console.log(`✅ Updated restaurant ${restaurant.name} status: ${restaurant.subscriptionStatus} → ${newStatus}`);
      return { success: true, oldStatus: restaurant.subscriptionStatus, newStatus };
    }

    return { success: true, noChange: true };
  } catch (error) {
    console.error('Error updating restaurant subscription status:', error);
    return { success: false, error };
  }
}

/**
 * Update subscription statuses for all restaurants
 * Returns restaurants that were newly suspended
 */
export async function updateAllSubscriptionStatuses() {
  try {
    const allRestaurants = await db.select().from(restaurants);
    const newlySuspended: any[] = [];
    let updated = 0;

    for (const restaurant of allRestaurants) {
      const result = await updateRestaurantSubscriptionStatus(restaurant.id);
      
      if (result.success && !result.noChange) {
        updated++;
        
        // Track newly suspended restaurants
        if (result.newStatus === 'suspended' && result.oldStatus !== 'suspended') {
          newlySuspended.push(restaurant);
        }
      }
    }

    console.log(`✅ Updated ${updated} restaurant subscription statuses`);
    return { success: true, updated, newlySuspended };
  } catch (error) {
    console.error('Error updating all subscription statuses:', error);
    return { success: false, error };
  }
}

/**
 * Get restaurants grouped by subscription status for daily report
 */
export async function getSubscriptionReport() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Get all restaurants with their subscription data
    const allRestaurants = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.isActive, true));

    // Filter and categorize
    const expiringToday: any[] = [];
    const expiringSoon: any[] = [];
    const expired: any[] = [];
    const suspended: any[] = [];
    let totalActive = 0;

    for (const restaurant of allRestaurants) {
      if (!restaurant.subscriptionExpiresAt) continue;

      const expiryDate = new Date(restaurant.subscriptionExpiresAt);
      const status = restaurant.subscriptionStatus;

      // Count truly active (not suspended/inactive)
      if (status === 'active' || status === 'expiring_soon') {
        totalActive++;
      }

      // Categorize for report
      if (status === 'suspended') {
        suspended.push(restaurant);
      } else if (status === 'expired') {
        expired.push(restaurant);
      } else {
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry === 0) {
          expiringToday.push(restaurant);
        } else if (daysUntilExpiry > 0 && daysUntilExpiry <= 3) {
          expiringSoon.push(restaurant);
        }
      }
    }

    return {
      success: true,
      expiringToday,
      expiringSoon,
      expired,
      suspended,
      totalActive,
    };
  } catch (error) {
    console.error('Error generating subscription report:', error);
    return { success: false, error };
  }
}

/**
 * Mark restaurant subscription as paid and extend
 */
export async function markSubscriptionPaid(
  restaurantId: string,
  paymentAmount: number,
  paymentDate: Date,
  extensionMonths: number = 1
) {
  try {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    // Calculate new expiry date
    const currentExpiry = restaurant.subscriptionExpiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    
    // If already expired, extend from today, otherwise from current expiry
    if (newExpiry < new Date()) {
      newExpiry.setTime(new Date().getTime());
    }
    
    newExpiry.setMonth(newExpiry.getMonth() + extensionMonths);

    // Update restaurant
    await db
      .update(restaurants)
      .set({
        subscriptionStatus: 'active',
        subscriptionExpiresAt: newExpiry,
        lastPaymentAmount: paymentAmount.toString(),
        lastPaymentDate: paymentDate,
        suspendedAt: null, // Clear suspension if any
        suspensionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));

    console.log(`✅ Marked subscription paid for ${restaurant.name}, extended until ${newExpiry}`);
    return { success: true, newExpiryDate: newExpiry };
  } catch (error) {
    console.error('Error marking subscription as paid:', error);
    return { success: false, error };
  }
}

/**
 * Manually suspend or reactivate a restaurant
 */
export async function toggleRestaurantSuspension(restaurantId: string, suspend: boolean, reason?: string) {
  try {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    if (suspend) {
      // Suspend restaurant
      await db
        .update(restaurants)
        .set({
          subscriptionStatus: 'suspended',
          suspendedAt: new Date(),
          suspensionReason: reason || 'Manual suspension by admin',
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, restaurantId));

      console.log(`✅ Suspended restaurant: ${restaurant.name}`);
      return { success: true, action: 'suspended' };
    } else {
      // Reactivate restaurant - recalculate status based on expiry
      const newStatus = calculateSubscriptionStatus(
        restaurant.subscriptionExpiresAt,
        restaurant.gracePeriodDays || 2
      );

      await db
        .update(restaurants)
        .set({
          subscriptionStatus: newStatus,
          suspendedAt: null,
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(restaurants.id, restaurantId));

      console.log(`✅ Reactivated restaurant: ${restaurant.name} (status: ${newStatus})`);
      return { success: true, action: 'reactivated', newStatus };
    }
  } catch (error) {
    console.error('Error toggling restaurant suspension:', error);
    return { success: false, error };
  }
}

/**
 * Extend subscription manually (for discounts/offers)
 */
export async function extendSubscription(restaurantId: string, days: number) {
  try {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (!restaurant) {
      return { success: false, error: 'Restaurant not found' };
    }

    const currentExpiry = restaurant.subscriptionExpiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + days);

    // Recalculate status
    const newStatus = calculateSubscriptionStatus(newExpiry, restaurant.gracePeriodDays || 2);

    await db
      .update(restaurants)
      .set({
        subscriptionExpiresAt: newExpiry,
        subscriptionStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurantId));

    console.log(`✅ Extended subscription for ${restaurant.name} by ${days} days`);
    return { success: true, newExpiryDate: newExpiry, newStatus };
  } catch (error) {
    console.error('Error extending subscription:', error);
    return { success: false, error };
  }
}

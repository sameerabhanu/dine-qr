/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: {
  status: string;
  currentPeriodEnd: Date | null;
  setupFeePaid: boolean;
}): boolean {
  if (!subscription.setupFeePaid) {
    return false;
  }

  if (subscription.status === 'active') {
    if (!subscription.currentPeriodEnd) {
      return true; // Setup fee paid, no expiry yet
    }
    return new Date() < subscription.currentPeriodEnd;
  }

  if (subscription.status === 'grace_period') {
    return true; // Still works during grace period
  }

  return false;
}

/**
 * Check if subscription is in grace period
 */
export function isInGracePeriod(subscription: {
  status: string;
  currentPeriodEnd: Date | null;
}): boolean {
  if (subscription.status !== 'grace_period') {
    return false;
  }

  if (!subscription.currentPeriodEnd) {
    return false;
  }

  // Grace period is 7 days after expiry
  const gracePeriodEnd = new Date(subscription.currentPeriodEnd);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  return new Date() < gracePeriodEnd;
}

/**
 * Calculate next billing date (1 year from current period end or setup)
 */
export function calculateNextBillingDate(currentPeriodEnd: Date | null): Date {
  const baseDate = currentPeriodEnd || new Date();
  const nextBilling = new Date(baseDate);
  nextBilling.setFullYear(nextBilling.getFullYear() + 1);
  return nextBilling;
}

/**
 * Get subscription status message
 */
export function getSubscriptionStatusMessage(subscription: {
  status: string;
  currentPeriodEnd: Date | null;
  setupFeePaid: boolean;
}): string {
  if (!subscription.setupFeePaid) {
    return 'Setup fee payment pending';
  }

  switch (subscription.status) {
    case 'active':
      if (!subscription.currentPeriodEnd) {
        return 'Active (first year included with setup)';
      }
      return `Active until ${subscription.currentPeriodEnd.toLocaleDateString('en-IN')}`;
    case 'grace_period':
      return 'Subscription expired - Grace period (7 days)';
    case 'expired':
      return 'Subscription expired - Please renew';
    case 'cancelled':
      return 'Subscription cancelled';
    default:
      return 'Unknown status';
  }
}

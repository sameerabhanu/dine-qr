import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { staff, restaurants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

/**
 * Check if the user is authenticated for a specific restaurant
 * Returns the staff member if authenticated, null otherwise
 */
export async function getRestaurantAuth(slug: string) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`restaurant_${slug}_auth`);

    console.log('🍪 Cookie check:', {
      slug,
      cookieName: `restaurant_${slug}_auth`,
      hasCookie: !!authCookie,
      cookieValue: authCookie?.value,
    });

    if (!authCookie) {
      return null;
    }

    const staffId = authCookie.value;

    // Verify staff member exists and is active
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.id, staffId),
          eq(staff.isActive, true)
        )
      )
      .limit(1);

    console.log('👤 Staff lookup:', {
      staffId,
      found: !!staffMember,
      staffName: staffMember?.name,
      staffRole: staffMember?.role,
    });

    return staffMember || null;
  } catch (error) {
    console.error('Restaurant auth error:', error);
    return null;
  }
}

/**
 * Require authentication for restaurant admin pages
 * Redirects to login if not authenticated
 * Supports both restaurant staff and super admin access
 * 
 * Note: This function will redirect and never return if unauthorized
 */
export async function requireRestaurantAuth(slug: string, redirectPath?: string) {
  // Fetch restaurant
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);

  if (!restaurant) {
    // Restaurant not found - this will throw and never return
    throw new Error('Restaurant not found');
  }

  // Check restaurant-specific authentication first
  const restaurantAuth = await getRestaurantAuth(slug);
  
  // If no restaurant auth, check for super admin session
  const session = await auth();

  console.log('🔐 Auth Check:', {
    slug,
    hasRestaurantAuth: !!restaurantAuth,
    restaurantAuthId: restaurantAuth?.restaurantId,
    hasSession: !!session,
    sessionUserType: session?.user.userType,
    sessionRestaurantId: session?.user.restaurantId,
    targetRestaurantId: restaurant.id,
  });

  // Must be authenticated either as restaurant staff OR super admin
  const isAuthorized = 
    restaurantAuth?.restaurantId === restaurant.id ||
    session?.user.userType === 'super_admin' ||
    session?.user.restaurantId === restaurant.id;

  console.log('🔐 Authorization result:', isAuthorized);

  if (!isAuthorized) {
    const redirect_url = redirectPath || `/${slug}/admin`;
    console.log('🔐 Redirecting to login page');
    redirect(`/${slug}/login?redirect=${redirect_url}`);
  }

  // This return is only reached if authorized and restaurant exists
  return { 
    authorized: true as const, 
    restaurant: restaurant!, 
    staffMember: restaurantAuth,
    isSuperAdmin: session?.user.userType === 'super_admin'
  };
}

/**
 * Logout from restaurant admin
 */
export async function logoutRestaurant(slug: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(`restaurant_${slug}_auth`);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

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
    const lastActivityCookie = cookieStore.get(`restaurant_${slug}_activity`);

    console.log('🍪 Cookie check:', {
      slug,
      cookieName: `restaurant_${slug}_auth`,
      hasCookie: !!authCookie,
      cookieValue: authCookie?.value,
      lastActivity: lastActivityCookie?.value,
    });

    if (!authCookie) {
      return null;
    }

    // Check for inactivity timeout (30 minutes)
    if (lastActivityCookie) {
      const lastActivity = parseInt(lastActivityCookie.value);
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      
      if (lastActivity < thirtyMinutesAgo) {
        console.log('🔒 Session expired due to inactivity');
        // Just return null - cookies will be cleared by logout or next API call
        return null;
      }
    }

    // Note: Activity timestamp is updated by the API route, not here
    // Server Components cannot modify cookies

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
  console.log('🔍 requireRestaurantAuth called for slug:', slug);
  
  // Fetch restaurant
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);

  console.log('🏪 Restaurant found:', {
    id: restaurant?.id,
    name: restaurant?.name,
    subscriptionStatus: restaurant?.subscriptionStatus,
  });

  if (!restaurant) {
    console.error('❌ Restaurant not found');
    throw new Error('Restaurant not found');
  }

  // Check if restaurant is suspended or inactive (only if field exists)
  const status = restaurant.subscriptionStatus || 'active'; // Default to active if not set
  console.log('📊 Subscription status:', status);
  
  if (status === 'suspended' || status === 'inactive') {
    console.log('🚫 Restaurant is suspended/inactive - blocking access');
    // Clear auth cookies
    const cookieStore = await cookies();
    cookieStore.delete(`restaurant_${slug}_auth`);
    cookieStore.delete(`restaurant_${slug}_activity`);
    // Redirect to login with suspension message
    redirect(`/${slug}/login?suspended=true`);
  }

  // Check restaurant-specific authentication first
  const restaurantAuth = await getRestaurantAuth(slug);
  
  // If no restaurant auth, check for super admin session
  const session = await auth();

  console.log('🔐 Auth Check:', {
    slug,
    hasRestaurantAuth: !!restaurantAuth,
    restaurantAuthId: restaurantAuth?.restaurantId,
    restaurantAuthStaffId: restaurantAuth?.id,
    hasSession: !!session,
    sessionUserType: session?.user?.userType,
    sessionRestaurantId: session?.user?.restaurantId,
    targetRestaurantId: restaurant.id,
  });

  // Must be authenticated either as restaurant staff OR super admin
  const isAuthorized = 
    restaurantAuth?.restaurantId === restaurant.id ||
    session?.user.userType === 'super_admin' ||
    session?.user.restaurantId === restaurant.id;

  console.log('🔐 Authorization result:', isAuthorized);
  console.log('🔐 Authorization check details:', {
    'restaurantAuth?.restaurantId === restaurant.id': restaurantAuth?.restaurantId === restaurant.id,
    'session?.user.userType === super_admin': session?.user.userType === 'super_admin',
    'session?.user.restaurantId === restaurant.id': session?.user.restaurantId === restaurant.id,
  });

  if (!isAuthorized) {
    const redirect_url = redirectPath || `/${slug}/admin`;
    console.log('❌ NOT AUTHORIZED - Redirecting to login page');
    redirect(`/${slug}/login?redirect=${redirect_url}`);
  }

  console.log('✅ AUTHORIZED - Allowing access');

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
    cookieStore.delete(`restaurant_${slug}_activity`);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

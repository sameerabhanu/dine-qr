import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { staff, restaurants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * Check API authentication for restaurant operations
 * Supports both restaurant staff cookie auth and Next-Auth session
 */
export async function verifyRestaurantApiAuth(slug: string) {
  try {
    // Get restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return { authorized: false, error: 'Restaurant not found', restaurant: null };
    }

    // Check restaurant-specific cookie authentication
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`restaurant_${slug}_auth`);

    if (authCookie) {
      const staffId = authCookie.value;
      const [staffMember] = await db
        .select()
        .from(staff)
        .where(
          and(
            eq(staff.id, staffId),
            eq(staff.isActive, true),
            eq(staff.restaurantId, restaurant.id)
          )
        )
        .limit(1);

      if (staffMember) {
        return { 
          authorized: true, 
          restaurant, 
          userType: 'staff',
          userId: staffMember.id 
        };
      }
    }

    // Check Next-Auth session
    const session = await auth();
    
    if (session) {
      // Super admin can access any restaurant
      if (session.user.userType === 'super_admin') {
        return { 
          authorized: true, 
          restaurant, 
          userType: 'super_admin',
          userId: session.user.id 
        };
      }

      // Restaurant admin/staff can access their own restaurant
      if (session.user.restaurantId === restaurant.id) {
        return { 
          authorized: true, 
          restaurant, 
          userType: session.user.userType,
          userId: session.user.id 
        };
      }
    }

    return { authorized: false, error: 'Unauthorized', restaurant: null };
  } catch (error) {
    console.error('API auth error:', error);
    return { authorized: false, error: 'Authentication failed', restaurant: null };
  }
}

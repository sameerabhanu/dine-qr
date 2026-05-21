import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { staff } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';

/**
 * Check if the user is authenticated as a waiter for a specific restaurant
 * Returns the waiter (staff) member if authenticated, null otherwise
 */
export async function getWaiterAuth(slug: string) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`waiter_${slug}_auth`);

    console.log('🍽️ Waiter auth check:', {
      slug,
      cookieName: `waiter_${slug}_auth`,
      hasCookie: !!authCookie,
    });

    if (!authCookie) {
      return null;
    }

    const waiterId = authCookie.value;

    // Verify waiter exists, is active, and has waiter role
    const [waiter] = await db
      .select()
      .from(staff)
      .where(
        and(
          eq(staff.id, waiterId),
          eq(staff.role, 'waiter'),
          eq(staff.isActive, true)
        )
      )
      .limit(1);

    console.log('👤 Waiter lookup:', {
      waiterId,
      found: !!waiter,
      waiterName: waiter?.name,
    });

    return waiter || null;
  } catch (error) {
    console.error('Waiter auth error:', error);
    return null;
  }
}

/**
 * Require waiter authentication for waiter pages
 * Redirects to login if not authenticated
 */
export async function requireWaiterAuth(slug: string, redirectPath?: string) {
  const waiter = await getWaiterAuth(slug);

  if (!waiter) {
    const redirect_url = redirectPath || `/${slug}/waiter`;
    redirect(`/${slug}/waiter-login?redirect=${redirect_url}`);
  }

  return { 
    authorized: true, 
    waiter: waiter!
  };
}

/**
 * Logout from waiter session
 */
export async function logoutWaiter(slug: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(`waiter_${slug}_auth`);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

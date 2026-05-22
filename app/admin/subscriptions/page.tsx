import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import SubscriptionsClient from './SubscriptionsClient';

export default async function SubscriptionsPage() {
  const session = await auth();

  // Check if user is super admin
  if (!session || session.user.userType !== 'super_admin') {
    redirect('/admin/login');
  }

  // Fetch all restaurants with subscription data
  const allRestaurants = await db
    .select()
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt));

  return (
    <div className="min-h-screen bg-gray-50">
      <SubscriptionsClient restaurants={allRestaurants} />
    </div>
  );
}

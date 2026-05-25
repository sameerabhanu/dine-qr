import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { sendMonthlyReport } from '@/lib/email';

// This endpoint should be called on the 1st of every month via Vercel Cron
// Add to vercel.json: { "crons": [{ "path": "/api/cron/monthly-report", "schedule": "0 0 1 * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has the correct authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Starting monthly report generation...');

    // Fetch all restaurants with their last month order counts
    const allRestaurants = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        location: restaurants.location,
        phone: restaurants.phone,
        lastMonthOrdersCount: restaurants.lastMonthOrdersCount,
      })
      .from(restaurants);

    console.log(`📧 Sending monthly reports for ${allRestaurants.length} restaurants`);

    // Send email for each restaurant
    for (const restaurant of allRestaurants) {
      await sendMonthlyReport({
        restaurantName: restaurant.name,
        location: restaurant.location || 'N/A',
        contact: restaurant.phone || 'N/A',
        lastMonthOrdersCount: restaurant.lastMonthOrdersCount || 0,
      });
    }

    console.log('✅ Monthly reports sent successfully');

    return NextResponse.json({
      success: true,
      reportsSent: allRestaurants.length,
      message: `Successfully sent ${allRestaurants.length} monthly reports`,
    });
  } catch (error: any) {
    console.error('❌ Error during monthly report generation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate monthly reports',
      },
      { status: 500 }
    );
  }
}

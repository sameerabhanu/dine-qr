import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants } from '@/lib/db/schema';
import { sendMonthlyReportToRam, sendMonthlyReportToAgency } from '@/lib/email';
import { sql } from 'drizzle-orm';

// This endpoint runs on the 1st of every month at midnight via Vercel Cron
// Schedule: "0 0 1 * *" (00:00 on 1st day of every month)

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has the correct authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Starting monthly rollover and report generation...');

    // STEP 1: Fetch all restaurants BEFORE rollover (to get last month data)
    const allRestaurants = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        phone: restaurants.phone,
        address: restaurants.address,
        agencyName: restaurants.agencyName,
        agencyLocation: restaurants.agencyLocation,
        agencyContact: restaurants.agencyContact,
        currentMonthOrdersCount: restaurants.currentMonthOrdersCount,
      })
      .from(restaurants);

    console.log(`📋 Found ${allRestaurants.length} restaurants`);

    // Calculate total orders for this agency (sum of all restaurants)
    const totalOrders = allRestaurants.reduce(
      (sum, r) => sum + (r.currentMonthOrdersCount || 0), 
      0
    );

    // STEP 2: Roll over counters for ALL restaurants
    // lastMonthOrdersCount = currentMonthOrdersCount
    // currentMonthOrdersCount = 0
    await db.execute(sql`
      UPDATE restaurants 
      SET 
        last_month_orders_count = current_month_orders_count,
        current_month_orders_count = 0
    `);

    console.log('✅ Counters rolled over successfully');

    // STEP 3: Send Email to Ram (Freelancer)
    // Simple 4-line summary of this agency's total orders
    const agencyInfo = {
      name: allRestaurants[0]?.agencyName || 'N/A',
      location: allRestaurants[0]?.agencyLocation || 'N/A',
      contact: allRestaurants[0]?.agencyContact || 'N/A',
    };

    await sendMonthlyReportToRam({
      agencyName: agencyInfo.name,
      agencyLocation: agencyInfo.location,
      agencyContact: agencyInfo.contact,
      lastMonthOrdersCount: totalOrders,
    });

    console.log(`📧 Sent report to Ram: ${totalOrders} orders`);

    // STEP 4: Send Email to Agency Manager
    // Detailed table with all restaurants
    await sendMonthlyReportToAgency({
      agencyName: agencyInfo.name,
      restaurants: allRestaurants.map(r => ({
        name: r.name,
        location: r.address || 'N/A',
        phone: r.phone || 'N/A',
        lastMonthOrders: r.currentMonthOrdersCount || 0, // Before rollover
      })),
      totalOrders,
    });

    console.log(`📧 Sent detailed report to Agency Manager`);

    return NextResponse.json({
      success: true,
      message: 'Monthly rollover completed and reports sent',
      totalOrders,
      restaurantsCount: allRestaurants.length,
    });
  } catch (error: any) {
    console.error('❌ Error during monthly rollover:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to complete monthly rollover',
      },
      { status: 500 }
    );
  }
}

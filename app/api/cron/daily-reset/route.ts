import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { orders, orderItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// This endpoint runs daily at midnight via Vercel Cron
// Schedule: "0 0 * * *" (00:00 every day)

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has the correct authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌅 Starting daily counter reset...');

    // STEP 1: Handle unconfirmed payments (payment_collected orders)
    // Count and add them to monthly count before deleting
    console.log('📊 Counting unconfirmed payments...');
    
    const unconfirmedOrders = await db.execute<{
      restaurant_id: string;
      pending_count: string;
    }>(sql`
      SELECT restaurant_id, COUNT(*) as pending_count
      FROM orders
      WHERE status = 'payment_collected'
      GROUP BY restaurant_id
    `);

    console.log(`Found ${unconfirmedOrders.length} restaurants with unconfirmed payments`);

    // Add unconfirmed payment counts to monthly count and delete orders
    for (const row of unconfirmedOrders) {
      const restaurantId = row.restaurant_id;
      const pendingCount = parseInt(row.pending_count);

      console.log(`Restaurant ${restaurantId}: Adding ${pendingCount} unconfirmed payments to monthly count`);

      // Increment monthly count
      await db.execute(sql`
        UPDATE restaurants 
        SET current_month_orders_count = current_month_orders_count + ${pendingCount}
        WHERE id = ${restaurantId}
      `);

      // Delete order items first (foreign key constraint)
      await db.execute(sql`
        DELETE FROM order_items
        WHERE order_id IN (
          SELECT id FROM orders 
          WHERE restaurant_id = ${restaurantId} 
          AND status = 'payment_collected'
        )
      `);

      // Delete the orders
      await db.execute(sql`
        DELETE FROM orders
        WHERE restaurant_id = ${restaurantId} 
        AND status = 'payment_collected'
      `);

      console.log(`✅ Processed ${pendingCount} unconfirmed orders for restaurant ${restaurantId}`);
    }

    // STEP 2: Reset today's counter for all restaurants
    console.log('🔄 Resetting daily counters...');
    await db.execute(sql`
      UPDATE restaurants 
      SET today_orders_count = 0
    `);

    console.log('✅ Daily counters reset successfully');

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed',
      unconfirmedOrdersProcessed: unconfirmedOrders.length,
    });
  } catch (error: any) {
    console.error('❌ Error during daily reset:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to complete daily reset',
      },
      { status: 500 }
    );
  }
}

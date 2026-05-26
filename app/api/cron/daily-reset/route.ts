import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

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

    // Reset today's counter for all restaurants
    await db.execute(sql`
      UPDATE restaurants 
      SET today_orders_count = 0
    `);

    console.log('✅ Daily counters reset successfully');

    return NextResponse.json({
      success: true,
      message: 'Daily reset completed',
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

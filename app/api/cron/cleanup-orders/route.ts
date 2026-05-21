import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { lt } from 'drizzle-orm';

// This endpoint should be called daily at 2 AM via Vercel Cron or external service
// Add to vercel.json: { "crons": [{ "path": "/api/cron/cleanup-orders", "schedule": "0 2 * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has the correct authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate yesterday's date (keep only today's orders)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    console.log('🗑️  Starting daily order cleanup...');
    console.log('📅 Deleting orders older than:', yesterday.toISOString());

    // Delete old order items first (foreign key constraint)
    const oldOrderIds = await db
      .select({ id: orders.id })
      .from(orders)
      .where(lt(orders.createdAt, yesterday));

    if (oldOrderIds.length > 0) {
      const idsToDelete = oldOrderIds.map(o => o.id);
      
      // Delete order items
      await db
        .delete(orderItems)
        .where(lt(orderItems.createdAt, yesterday));

      // Delete orders
      await db
        .delete(orders)
        .where(lt(orders.createdAt, yesterday));

      console.log(`✅ Cleanup complete: Deleted ${oldOrderIds.length} orders and their items`);

      return NextResponse.json({
        success: true,
        deletedCount: oldOrderIds.length,
        deletedBefore: yesterday.toISOString(),
        message: `Successfully deleted ${oldOrderIds.length} old orders`,
      });
    } else {
      console.log('✅ No old orders to delete');
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No old orders to delete',
      });
    }
  } catch (error: any) {
    console.error('❌ Error during order cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to cleanup orders',
      },
      { status: 500 }
    );
  }
}

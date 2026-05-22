import { NextRequest, NextResponse } from 'next/server';
import { updateAllSubscriptionStatuses } from '@/lib/subscription';

/**
 * Cron Job: Update subscription statuses for all restaurants
 * Runs every hour to keep statuses current
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Running subscription status update cron job...');
    
    const result = await updateAllSubscriptionStatuses();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to update subscription statuses', details: result.error },
        { status: 500 }
      );
    }

    console.log(`✅ Subscription status update complete: ${result.updated} updated`);
    
    return NextResponse.json({
      success: true,
      updated: result.updated,
      newlySuspended: result.newlySuspended?.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

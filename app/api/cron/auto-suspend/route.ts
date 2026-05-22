import { NextRequest, NextResponse } from 'next/server';
import { updateAllSubscriptionStatuses } from '@/lib/subscription';
import { sendSuspensionNotification } from '@/lib/email';

/**
 * Cron Job: Auto-suspend restaurants past grace period
 * Runs every day at midnight IST
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Running auto-suspension cron job...');
    
    // Update all statuses (this will auto-suspend restaurants past grace period)
    const result = await updateAllSubscriptionStatuses();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to run auto-suspension', details: result.error },
        { status: 500 }
      );
    }

    // Send email notifications for newly suspended restaurants
    const emailResults = [];
    if (result.newlySuspended && result.newlySuspended.length > 0) {
      console.log(`📧 Sending suspension notifications for ${result.newlySuspended.length} restaurants`);
      
      for (const restaurant of result.newlySuspended) {
        const emailResult = await sendSuspensionNotification(restaurant);
        emailResults.push({
          restaurant: restaurant.name,
          success: emailResult.success,
        });
      }
    }

    console.log(`✅ Auto-suspension complete: ${result.newlySuspended?.length || 0} suspended`);
    
    return NextResponse.json({
      success: true,
      suspended: result.newlySuspended?.length || 0,
      emailsSent: emailResults.filter(r => r.success).length,
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

import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionReport } from '@/lib/subscription';
import { sendDailySubscriptionReport } from '@/lib/email';

/**
 * Cron Job: Send daily subscription report to admin
 * Runs every day at 9:00 AM IST (3:30 AM UTC)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📊 Running daily subscription report cron job...');
    
    // Get subscription report data
    const report = await getSubscriptionReport();

    if (!report.success) {
      return NextResponse.json(
        { error: 'Failed to generate report', details: report.error },
        { status: 500 }
      );
    }

    // Send email report
    const emailResult = await sendDailySubscriptionReport({
      expiringToday: report.expiringToday || [],
      expiringSoon: report.expiringSoon || [],
      expired: report.expired || [],
      suspended: report.suspended || [],
      totalActive: report.totalActive || 0,
    });

    if (emailResult.skipped) {
      console.log('📊 No restaurants to report - email skipped');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'No restaurants requiring attention',
        timestamp: new Date().toISOString(),
      });
    }

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }

    console.log('✅ Daily subscription report sent successfully');
    
    return NextResponse.json({
      success: true,
      reportSummary: {
        expiringToday: report.expiringToday?.length || 0,
        expiringSoon: report.expiringSoon?.length || 0,
        expired: report.expired?.length || 0,
        suspended: report.suspended?.length || 0,
        totalActive: report.totalActive || 0,
      },
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

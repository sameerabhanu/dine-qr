import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { markSubscriptionPaid } from '@/lib/subscription';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check super admin auth
    const session = await auth();
    if (!session || session.user.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const { amount, date, extensionMonths } = await request.json();

    if (!amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await markSubscriptionPaid(
      id,
      parseFloat(amount),
      new Date(date),
      extensionMonths || 1
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to mark as paid' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newExpiryDate: result.newExpiryDate,
    });
  } catch (error: any) {
    console.error('Error marking subscription as paid:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

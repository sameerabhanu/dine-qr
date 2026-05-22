import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { extendSubscription } from '@/lib/subscription';

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
    const { days } = await request.json();

    if (!days || days < 1) {
      return NextResponse.json(
        { error: 'Invalid number of days' },
        { status: 400 }
      );
    }

    const result = await extendSubscription(id, parseInt(days));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to extend subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newExpiryDate: result.newExpiryDate,
      newStatus: result.newStatus,
    });
  } catch (error: any) {
    console.error('Error extending subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

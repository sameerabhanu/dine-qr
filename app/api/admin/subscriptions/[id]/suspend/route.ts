import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { toggleRestaurantSuspension } from '@/lib/subscription';

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
    const { suspend, reason } = await request.json();

    if (suspend === undefined) {
      return NextResponse.json(
        { error: 'Missing suspend parameter' },
        { status: 400 }
      );
    }

    const result = await toggleRestaurantSuspension(id, suspend, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      newStatus: result.newStatus,
    });
  } catch (error: any) {
    console.error('Error toggling suspension:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

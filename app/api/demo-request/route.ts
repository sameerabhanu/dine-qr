import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { demoRequests } from '@/lib/db/schema';
import { sendDemoRequestEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantName, ownerName, email, phone, address } = body;

    // Validate required fields
    if (!restaurantName || !ownerName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Save demo request to database
    const [demoRequest] = await db
      .insert(demoRequests)
      .values({
        restaurantName,
        ownerName,
        email,
        phone,
        address: address || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Send email notification to admin
    const emailResult = await sendDemoRequestEmail({
      name: restaurantName,
      ownerName,
      email,
      phone,
      address: address || 'Not provided',
    });

    if (!emailResult.success) {
      console.error('Failed to send demo request email, but request was saved:', emailResult.error);
      // Don't fail the request if email fails - admin can still see it in dashboard
    }

    return NextResponse.json({
      success: true,
      message: 'Demo request submitted successfully. We will contact you soon!',
      requestId: demoRequest.id,
    });
  } catch (error: any) {
    console.error('Error submitting demo request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit demo request' },
      { status: 500 }
    );
  }
}

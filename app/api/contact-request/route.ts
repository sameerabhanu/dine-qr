import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// For now, we'll store requests in a simple table
// You can later integrate with email services like Resend, SendGrid, etc.

// Create a simple requests table schema if needed
// For now, let's just log to console and return success

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerName, email, phone, address, numberOfTables } = body;

    // Validate required fields
    if (!name || !ownerName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the request (you can see this in your terminal)
    console.log('\n🔔 NEW RESTAURANT REQUEST:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 Restaurant Name:', name);
    console.log('👤 Owner Name:', ownerName);
    console.log('📧 Email:', email);
    console.log('📱 Phone:', phone);
    console.log('🏠 Address:', address || 'Not provided');
    console.log('🪑 Tables:', numberOfTables || 'Not specified');
    console.log('🕐 Requested At:', new Date().toLocaleString('en-IN'));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TODO: Send email notification to your email
    // You can integrate with:
    // - Resend (resend.com)
    // - SendGrid
    // - Nodemailer
    // - Any email service

    // Example with Resend (you'll need to install and configure):
    // await resend.emails.send({
    //   from: 'DineQR <noreply@dineqr.com>',
    //   to: 'your-email@example.com',
    //   subject: `New Restaurant Request: ${name}`,
    //   html: `
    //     <h2>New Restaurant Request</h2>
    //     <p><strong>Restaurant:</strong> ${name}</p>
    //     <p><strong>Owner:</strong> ${ownerName}</p>
    //     <p><strong>Email:</strong> ${email}</p>
    //     <p><strong>Phone:</strong> ${phone}</p>
    //     <p><strong>Address:</strong> ${address}</p>
    //     <p><strong>Tables:</strong> ${numberOfTables}</p>
    //   `
    // });

    return NextResponse.json({
      success: true,
      message: 'Request received successfully',
    });
  } catch (error) {
    console.error('Contact request error:', error);
    return NextResponse.json(
      { error: 'Failed to send request' },
      { status: 500 }
    );
  }
}

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const ADMIN_EMAIL = 'vanumudemo2@gmail.com';
export const ADMIN_PHONE = '+91-8333027544';
export const BRAND_NAME = 'DineQR';

/**
 * Send demo request notification to admin
 */
export async function sendDemoRequestEmail(restaurantData: {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
}) {
  try {
    console.log('📧 Attempting to send demo request email...');
    console.log('Resend API Key exists:', !!process.env.RESEND_API_KEY);
    console.log('Admin email:', ADMIN_EMAIL);
    console.log('Restaurant data:', restaurantData.name);
    
    const { data, error } = await resend.emails.send({
      from: 'DineQR <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `🎯 New Demo Request - ${restaurantData.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .info-box { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #000; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #000; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎯 New Demo Request</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  A new restaurant has requested a demo. Here are the details:
                </p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Restaurant Name:</span> ${restaurantData.name}
                  </div>
                  <div class="info-row">
                    <span class="label">Owner Name:</span> ${restaurantData.ownerName}
                  </div>
                  <div class="info-row">
                    <span class="label">Email:</span> <a href="mailto:${restaurantData.email}">${restaurantData.email}</a>
                  </div>
                  <div class="info-row">
                    <span class="label">Phone:</span> <a href="tel:${restaurantData.phone}">${restaurantData.phone}</a>
                  </div>
                  <div class="info-row">
                    <span class="label">Address:</span> ${restaurantData.address}
                  </div>
                  <div class="info-row">
                    <span class="label">Requested At:</span> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                </div>

                <p style="margin-top: 30px;">
                  <strong>Next Steps:</strong><br>
                  1. Review the restaurant details<br>
                  2. Contact them to discuss requirements<br>
                  3. Create their account in the admin panel
                </p>
              </div>
              <div class="footer">
                <p>DineQR Subscription Management System</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send demo request email:', error);
      return { success: false, error };
    }

    console.log('✅ Demo request email sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending demo request email:', error);
    return { success: false, error };
  }
}

/**
 * Send daily subscription report to admin
 */
export async function sendDailySubscriptionReport(report: {
  expiringToday: any[];
  expiringSoon: any[];
  expired: any[];
  suspended: any[];
  totalActive: number;
}) {
  const { expiringToday, expiringSoon, expired, suspended, totalActive } = report;

  // Only send if there's something to report
  if (expiringToday.length === 0 && expiringSoon.length === 0 && expired.length === 0 && suspended.length === 0) {
    console.log('📊 No restaurants to report - skipping email');
    return { success: true, skipped: true };
  }

  const formatRestaurant = (r: any) => `
    <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #000;">
      <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${r.name}</div>
      <div style="font-size: 14px; color: #666;">
        ${r.subscriptionExpiresAt ? `<div>Expires: ${new Date(r.subscriptionExpiresAt).toLocaleDateString('en-IN')}</div>` : ''}
        <div>Contact: ${r.phone}</div>
        ${r.email ? `<div>Email: ${r.email}</div>` : ''}
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'DineQR <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `📊 DineQR Subscription Report - ${new Date().toLocaleDateString('en-IN')}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
              .section { margin: 30px 0; }
              .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-left: 10px; border-left: 4px solid; }
              .urgent { border-color: #dc2626; color: #dc2626; }
              .warning { border-color: #ea580c; color: #ea580c; }
              .expired { border-color: #f59e0b; color: #f59e0b; }
              .summary { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📊 Daily Subscription Report</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Hi Admin,</p>
                <p>Here's your daily subscription status report:</p>

                ${expiringToday.length > 0 ? `
                  <div class="section">
                    <div class="section-title urgent">🔴 URGENT - Expiring TODAY (${expiringToday.length})</div>
                    ${expiringToday.map(formatRestaurant).join('')}
                  </div>
                ` : ''}

                ${expiringSoon.length > 0 ? `
                  <div class="section">
                    <div class="section-title warning">🟡 EXPIRING IN 3 DAYS (${expiringSoon.length})</div>
                    ${expiringSoon.map(formatRestaurant).join('')}
                  </div>
                ` : ''}

                ${expired.length > 0 ? `
                  <div class="section">
                    <div class="section-title expired">🟠 EXPIRED - Grace Period Active (${expired.length})</div>
                    ${expired.map(formatRestaurant).join('')}
                  </div>
                ` : ''}

                ${suspended.length > 0 ? `
                  <div class="section">
                    <div class="section-title" style="border-color: #7c3aed; color: #7c3aed;">🔴 SUSPENDED (${suspended.length})</div>
                    ${suspended.map(formatRestaurant).join('')}
                  </div>
                ` : ''}

                <div class="summary">
                  <h3 style="margin-top: 0;">📊 Summary</h3>
                  <div class="summary-row">
                    <span>Total Active:</span>
                    <strong>${totalActive} restaurants</strong>
                  </div>
                  <div class="summary-row">
                    <span>Expiring Today:</span>
                    <strong>${expiringToday.length}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Expiring in 3 days:</span>
                    <strong>${expiringSoon.length}</strong>
                  </div>
                  <div class="summary-row">
                    <span>In Grace Period:</span>
                    <strong>${expired.length}</strong>
                  </div>
                  <div class="summary-row" style="border-bottom: none;">
                    <span>Suspended:</span>
                    <strong>${suspended.length}</strong>
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dineqr-scan.vercel.app'}/admin/subscriptions" class="button">
                    Manage Subscriptions
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>DineQR Subscription Management System</p>
                <p style="font-size: 12px; margin-top: 10px;">This email is sent daily at 9:00 AM IST when there are restaurants requiring attention.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send daily report email:', error);
      return { success: false, error };
    }

    console.log('✅ Daily subscription report sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending daily report email:', error);
    return { success: false, error };
  }
}

/**
 * Send suspension notification to admin
 */
export async function sendSuspensionNotification(restaurant: any) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'DineQR <onboarding@resend.dev>',
      to: [ADMIN_EMAIL],
      subject: `🔴 Restaurant Suspended - ${restaurant.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #dc2626; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              .info-box { background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
              .info-row { margin: 10px 0; }
              .label { font-weight: bold; color: #000; }
              .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔴 Restaurant Auto-Suspended</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  A restaurant has been automatically suspended due to subscription expiry.
                </p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Restaurant Name:</span> ${restaurant.name}
                  </div>
                  <div class="info-row">
                    <span class="label">Subscription Expired:</span> ${new Date(restaurant.subscriptionExpiresAt).toLocaleDateString('en-IN')}
                  </div>
                  <div class="info-row">
                    <span class="label">Suspended At:</span> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </div>
                  <div class="info-row">
                    <span class="label">Contact:</span> ${restaurant.phone}
                  </div>
                  ${restaurant.email ? `
                  <div class="info-row">
                    <span class="label">Email:</span> ${restaurant.email}
                  </div>
                  ` : ''}
                </div>

                <p style="margin-top: 30px;">
                  <strong>Status:</strong><br>
                  ❌ Restaurant admin and waiters cannot login<br>
                  ❌ Customer ordering is disabled<br>
                  ❌ QR codes show "unavailable" message<br>
                  ✅ All data is preserved
                </p>

                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dineqr-scan.vercel.app'}/admin/subscriptions" class="button">
                    Manage Subscriptions
                  </a>
                </div>
              </div>
              <div class="footer">
                <p>DineQR Subscription Management System</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send suspension notification:', error);
      return { success: false, error };
    }

    console.log('✅ Suspension notification sent:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending suspension notification:', error);
    return { success: false, error };
  }
}

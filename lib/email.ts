import nodemailer from 'nodemailer';
import { AGENCY_INFO } from './config';

// Gmail SMTP Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
});

export const ADMIN_EMAIL = 'ramvanumu07@gmail.com';
export const ADMIN_PHONE = '+91-8333027544';
export const BRAND_NAME = 'DineQR';

/**
 * Send demo request notification to agency manager
 */
export async function sendDemoRequestEmail(restaurantData: {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
}) {
  try {
    console.log('📧 Attempting to send demo request email via Gmail SMTP...');
    console.log('Gmail user exists:', !!process.env.GMAIL_USER);
    console.log('Gmail password exists:', !!process.env.GMAIL_APP_PASSWORD);
    
    const agencyEmail = process.env.AGENCY_MANAGER_EMAIL;
    
    if (!agencyEmail) {
      console.error('⚠️ AGENCY_MANAGER_EMAIL not configured, cannot send demo request email');
      return { success: false, error: 'Agency manager email not configured' };
    }
    
    console.log('Agency manager email:', agencyEmail);
    console.log('Restaurant data:', restaurantData.name);
    
    const mailOptions = {
      from: `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`,
      to: agencyEmail,
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
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Demo request email sent successfully!');
    console.log('Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('❌ Error sending demo request email:', error);
    console.error('Error details:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send monthly report email to Ram (Freelancer)
 * Simple 4-line summary of agency's total orders
 */
export async function sendMonthlyReportToRam(data: {
  agencyName: string;
  agencyLocation: string;
  agencyContact: string;
  lastMonthOrdersCount: number;
}) {
  try {
    console.log('📧 Sending monthly report to Ram...');
    
    const mailOptions = {
      from: `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL, // ramvanumu07@gmail.com
      subject: `Monthly Report - ${data.agencyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
              .info-row { margin: 15px 0; font-size: 16px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <div class="info-row">
                  <span class="label">AGENCY:</span> ${data.agencyName}
                </div>
                <div class="info-row">
                  <span class="label">LOCATION:</span> ${data.agencyLocation}
                </div>
                <div class="info-row">
                  <span class="label">CONTACT:</span> ${data.agencyContact}
                </div>
                <div class="info-row">
                  <span class="label">LAST MONTH ORDERS:</span> ${data.lastMonthOrdersCount}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Monthly report sent to Ram for ${data.agencyName}`);
    console.log('Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('❌ Error sending report to Ram:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send monthly report email to Agency Manager
 * Detailed table with all restaurants under the agency
 */
export async function sendMonthlyReportToAgency(data: {
  agencyName: string;
  restaurants: Array<{
    name: string;
    location: string;
    phone: string;
    lastMonthOrders: number;
  }>;
  totalOrders: number;
}) {
  try {
    console.log('📧 Sending monthly report to Agency Manager...');
    
    const agencyEmail = process.env.AGENCY_MANAGER_EMAIL;
    
    if (!agencyEmail) {
      console.warn('⚠️ AGENCY_MANAGER_EMAIL not configured, skipping agency email');
      return { success: false, error: 'Agency email not configured' };
    }

    // Generate table rows
    const tableRows = data.restaurants
      .map(
        (r) => `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd;">${r.name}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${r.location}</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${r.phone}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${r.lastMonthOrders}</td>
        </tr>
      `
      )
      .join('');

    const mailOptions = {
      from: `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`,
      to: agencyEmail,
      subject: `Monthly Report - ${data.agencyName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { background: #000; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
              th { background: #000; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
              .total-row { background: #f0f0f0; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📊 Monthly Report - ${data.agencyName}</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Dear Manager,
                </p>
                <p>
                  Here's your monthly performance report for all restaurants:
                </p>
                
                <table>
                  <thead>
                    <tr>
                      <th>Restaurant Name</th>
                      <th>Location</th>
                      <th>Mobile Number</th>
                      <th style="text-align: right;">Last Month Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                    <tr class="total-row">
                      <td style="padding: 12px; border: 1px solid #ddd;">TOTAL</td>
                      <td style="padding: 12px; border: 1px solid #ddd;"></td>
                      <td style="padding: 12px; border: 1px solid #ddd;"></td>
                      <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${data.totalOrders}</td>
                    </tr>
                  </tbody>
                </table>

                <p style="margin-top: 30px;">
                  Regards,<br>
                  <strong>${BRAND_NAME} Team</strong>
                </p>
              </div>
              <div class="footer">
                <p>${BRAND_NAME} Management System</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Monthly report sent to Agency Manager for ${data.agencyName}`);
    console.log('Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('❌ Error sending report to Agency:', error);
    return { success: false, error: error.message };
  }
}

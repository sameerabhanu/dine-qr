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
    console.log('📧 Attempting to send demo request email via Gmail SMTP...');
    console.log('Gmail user exists:', !!process.env.GMAIL_USER);
    console.log('Gmail password exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('Admin email:', ADMIN_EMAIL);
    console.log('Restaurant data:', restaurantData.name);
    
    const mailOptions = {
      from: `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
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
 * Send monthly report email to super admin
 */
export async function sendMonthlyReport(data: {
  restaurantName: string;
  location: string;
  contact: string;
  lastMonthOrdersCount: number;
}) {
  try {
    console.log('📧 Sending monthly report email...');
    
    const mailOptions = {
      from: `"${BRAND_NAME}" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: 'Month End Report',
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
                <h1 style="margin: 0;">📊 Month End Report</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Hi Ram,
                </p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">AGENCY:</span> ${data.restaurantName}
                  </div>
                  <div class="info-row">
                    <span class="label">LOCATION:</span> ${data.location}
                  </div>
                  <div class="info-row">
                    <span class="label">CONTACT:</span> ${data.contact}
                  </div>
                  <div class="info-row">
                    <span class="label">LAST MONTH ORDERS COUNT:</span> ${data.lastMonthOrdersCount}
                  </div>
                </div>

                <p style="margin-top: 30px;">
                  Regards,<br>
                  <strong>${AGENCY_INFO.name}</strong>
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
    
    console.log(`✅ Monthly report email sent for ${data.restaurantName}`);
    console.log('Message ID:', info.messageId);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('❌ Error sending monthly report email:', error);
    console.error('Error details:', error.message);
    return { success: false, error: error.message };
  }
}

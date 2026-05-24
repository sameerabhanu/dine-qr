# Gmail SMTP Setup Guide

## How to Generate Gmail App Password

Since we switched from Resend to Gmail SMTP for sending emails, you need to generate a Gmail App Password.

### Steps to Generate Gmail App Password:

1. **Enable 2-Factor Authentication** (if not already enabled)
   - Go to https://myaccount.google.com/security
   - Under "Signing in to Google", enable "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Click "Select app" → Choose "Mail"
   - Click "Select device" → Choose "Other (Custom name)"
   - Enter "DineQR System" as the name
   - Click "Generate"
   - **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

3. **Add to Environment Variables**
   
   **For Local Development** (`.env.local`):
   ```
   GMAIL_USER=vanumudemo2@gmail.com
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   ```
   Note: Remove the spaces from the app password

   **For Vercel Deployment**:
   - Go to your Vercel project → Settings → Environment Variables
   - Add these two variables:
     - `GMAIL_USER` = `vanumudemo2@gmail.com`
     - `GMAIL_APP_PASSWORD` = `your-generated-app-password`

### Testing

After setting up:

1. Go to https://dineqr-order.vercel.app/request-demo
2. Fill out the demo form
3. Submit it
4. Check `vanumudemo2@gmail.com` inbox
5. You should receive an email with the demo request details!

### Why Gmail SMTP?

- ✅ **Free** - No cost for sending emails
- ✅ **Reliable** - Gmail's infrastructure
- ✅ **500 emails/day** - More than enough for your use case
- ✅ **No domain verification** - Unlike Resend, no domain setup needed
- ✅ **Simple setup** - Just username + app password

### Troubleshooting

If emails aren't sending:

1. Check Vercel deployment logs for errors
2. Verify the app password doesn't have spaces
3. Ensure 2-Factor Authentication is enabled on Gmail
4. Make sure the Gmail account is `vanumudemo2@gmail.com`

### Email Functions That Will Use Gmail SMTP

1. **Demo Request Notifications** - When restaurants request a demo
2. **Daily Subscription Reports** - Daily at 9 AM IST
3. **Suspension Notifications** - When restaurants get auto-suspended

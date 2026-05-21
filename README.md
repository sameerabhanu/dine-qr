# DineQR - Restaurant QR Code Ordering System

A modern, real-time restaurant ordering system with QR code integration, waiter management, and instant order updates.

## Features

- 🍽️ QR Code-based ordering for customers
- 👨‍🍳 Real-time waiter dashboard with instant order notifications
- 💳 Offline payment tracking (Cash/Card/UPI)
- 🏢 Multi-restaurant support
- 📱 Mobile-first responsive design
- ⚡ Real-time updates via Supabase Realtime

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ramvanumu07/DineQR.git
cd DineQR
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

4. Push database schema:
Run the SQL from `migrations/supabase-migration.sql` in your Supabase SQL Editor

5. Seed the database:
```bash
npm run db:seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Admin Credentials

- Email: `admin@dineqr.com`
- Password: `admin123`

**⚠️ Change these credentials immediately after first login!**

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ramvanumu07/DineQR)

Make sure to add all environment variables in your Vercel project settings.

## License

MIT

## Author

Ram Vanumu

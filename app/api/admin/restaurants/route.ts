import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { restaurants, subscriptions, tables, staff, payments } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      phone,
      email,
      address,
      numberOfTables,
      primaryColor,
      secondaryColor,
      ownerName,
      accessCode,
    } = body;

    // Validate required fields
    if (!name || !slug || !numberOfTables || !ownerName || !accessCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate access code is 4 digits
    if (!/^\d{4}$/.test(accessCode)) {
      return NextResponse.json(
        { error: 'Access code must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const [existingRestaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'A restaurant with this slug already exists' },
        { status: 400 }
      );
    }

    // Create restaurant
    const [restaurant] = await db
      .insert(restaurants)
      .values({
        id: randomUUID(),
        name,
        slug,
        phone: phone || null,
        email: email || null,
        address: address || null,
        primaryColor: primaryColor || '#000000',
        secondaryColor: secondaryColor || '#FFFFFF',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Create subscription
    const setupFeeAmount = 2499.0;
    const currentDate = new Date();
    const nextYear = new Date(currentDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    await db.insert(subscriptions).values({
      id: randomUUID(),
      restaurantId: restaurant.id,
      status: 'active',
      setupFeePaid: false,
      setupFeeAmount: setupFeeAmount.toString(),
      currentPeriodStart: currentDate,
      currentPeriodEnd: nextYear,
      nextBillingDate: nextYear,
      autoRenew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create payment record
    await db.insert(payments).values({
      id: randomUUID(),
      restaurantId: restaurant.id,
      amount: setupFeeAmount.toString(),
      currency: 'INR',
      type: 'setup_fee',
      status: 'pending',
      createdAt: new Date(),
    });

    // Create tables with QR codes
    const tablesToCreate = [];
    
    for (let i = 1; i <= numberOfTables; i++) {
      const qrCode = `${slug}-table-${i}-${randomUUID().substring(0, 8)}`;
      tablesToCreate.push({
        id: randomUUID(),
        restaurantId: restaurant.id,
        tableNumber: i.toString(),
        qrCode,
        capacity: 4,
        isActive: true,
        createdAt: new Date(),
      });
    }

    await db.insert(tables).values(tablesToCreate);

    // Create owner account with access code
    await db.insert(staff).values({
      id: randomUUID(),
      restaurantId: restaurant.id,
      name: ownerName,
      accessCode: accessCode,
      role: 'owner',
      isActive: true,
      createdAt: new Date(),
    });

    console.log('\n✅ RESTAURANT CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏪 Restaurant:', name);
    console.log('🔗 URL:', `/${slug}`);
    console.log('👤 Owner:', ownerName);
    console.log('🔢 Access Code:', accessCode);
    console.log('🪑 Tables:', numberOfTables);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return NextResponse.json({
      success: true,
      restaurantId: restaurant.id,
      slug: restaurant.slug,
      message: 'Restaurant created successfully!',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create restaurant';
    console.error('Error creating restaurant:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allRestaurants = await db
      .select()
      .from(restaurants)
      .orderBy(restaurants.createdAt);

    return NextResponse.json({ restaurants: allRestaurants });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch restaurants';
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, subscriptions, tables, staff, payments } from '@/lib/db/schema';
import { generateSlug } from '@/lib/utils';
import { hashPassword } from '@/lib/auth';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerName, email, phone, address, numberOfTables, password } = body;

    // Validate required fields
    if (!name || !ownerName || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = true;
    let counter = 1;

    while (slugExists) {
      const [existing] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.slug, slug))
        .limit(1);

      if (!existing) {
        slugExists = false;
      } else {
        slug = `${generateSlug(name)}-${counter}`;
        counter++;
      }
    }

    // Check if email already exists
    const [existingStaff] = await db
      .select()
      .from(staff)
      .where(eq(staff.email, email))
      .limit(1);

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create restaurant
    const [restaurant] = await db
      .insert(restaurants)
      .values({
        id: nanoid(),
        name,
        slug,
        email,
        phone,
        address,
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
      id: nanoid(),
      restaurantId: restaurant.id,
      status: 'active',
      setupFeePaid: false, // Will be paid later
      setupFeeAmount: setupFeeAmount.toString(),
      currentPeriodStart: currentDate,
      currentPeriodEnd: nextYear,
      nextBillingDate: nextYear,
      autoRenew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create pending payment record
    await db.insert(payments).values({
      id: nanoid(),
      restaurantId: restaurant.id,
      amount: setupFeeAmount.toString(),
      currency: 'INR',
      type: 'setup_fee',
      status: 'pending',
      createdAt: new Date(),
    });

    // Create tables with QR codes
    const tableRecords = [];
    for (let i = 1; i <= numberOfTables; i++) {
      tableRecords.push({
        id: nanoid(),
        restaurantId: restaurant.id,
        tableNumber: i.toString(),
        qrCode: `${slug}-table-${i}-${nanoid(8)}`,
        capacity: 4,
        isActive: true,
        createdAt: new Date(),
      });
    }

    await db.insert(tables).values(tableRecords);

    // Create staff/owner account
    await db.insert(staff).values({
      id: nanoid(),
      restaurantId: restaurant.id,
      name: ownerName,
      email,
      passwordHash,
      role: 'owner',
      isActive: true,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      slug: restaurant.slug,
      message: 'Restaurant registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register restaurant' },
      { status: 500 }
    );
  }
}

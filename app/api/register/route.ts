import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { restaurants, tables, staff } from '@/lib/db/schema';
import { generateSlug } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerName, email, phone, address, numberOfTables, accessCode } = body;

    // Validate required fields
    if (!name || !ownerName || !email || !phone || !accessCode) {
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
        accessCode,
      })
      .returning();

    // Create tables with QR codes
    const tableRecords = [];
    for (let i = 1; i <= numberOfTables; i++) {
      tableRecords.push({
        id: nanoid(),
        restaurantId: restaurant.id,
        tableNumber: i,
        qrCode: `${slug}-table-${i}-${nanoid(8)}`,
        isActive: true,
      });
    }

    await db.insert(tables).values(tableRecords);

    // Create staff/owner account with access code
    await db.insert(staff).values({
      id: nanoid(),
      restaurantId: restaurant.id,
      name: ownerName,
      accessCode,
      role: 'admin',
      isActive: true,
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

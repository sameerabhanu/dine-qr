import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tables } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get restaurant ID from slug
    const { restaurants } = await import('@/lib/db/schema');
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Get the highest table number
    const existingTables = await db
      .select()
      .from(tables)
      .where(eq(tables.restaurantId, restaurant.id))
      .orderBy(desc(tables.tableNumber));

    const nextTableNumber = existingTables.length > 0
      ? existingTables[0].tableNumber + 1
      : 1;

    // Generate unique QR code identifier (not the full URL)
    const qrCodeId = `${slug}-table-${nextTableNumber}-${randomUUID().substring(0, 8)}`;

    // Create new table
    const [newTable] = await db
      .insert(tables)
      .values({
        id: randomUUID(),
        restaurantId: restaurant.id,
        tableNumber: nextTableNumber,
        qrCode: qrCodeId,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newTable);
  } catch (error) {
    console.error('Error adding table:', error);
    return NextResponse.json(
      { error: 'Failed to add table' },
      { status: 500 }
    );
  }
}

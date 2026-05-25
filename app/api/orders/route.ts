import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, menuItems } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, tableId, items, specialInstructions } = body;

    console.log('📝 Creating order:', { restaurantId, tableId, itemCount: items?.length });

    if (!restaurantId || !tableId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch menu items to get prices and names with retry logic
    const menuItemIds = items.map((item: any) => item.menuItemId);
    
    let menuItemRecords = null;
    let retries = 3;
    
    while (retries > 0) {
      try {
        menuItemRecords = await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.restaurantId, restaurantId));
        break; // Success, exit retry loop
      } catch (error) {
        retries--;
        if (retries === 0) throw error; // Re-throw if no retries left
        console.log(`⚠️ Database query failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }

    if (!menuItemRecords) {
      throw new Error('Failed to fetch menu items');
    }

    const menuItemMap = new Map(
      menuItemRecords.map(item => [item.id, item])
    );

    // Calculate total with actual prices
    let total = 0;
    const itemsWithPrices = items.map((item: any) => {
      const menuItem = menuItemMap.get(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`);
      }
      const price = parseFloat(menuItem.price);
      const subtotal = price * item.quantity;
      total += subtotal;
      
      return {
        menuItemId: item.menuItemId,
        menuItemName: menuItem.name,
        quantity: item.quantity,
        priceAtOrder: price.toString(),
        subtotal: subtotal.toString(),
        customizations: item.customizations || {},
        notes: item.notes || null,
      };
    });

    console.log('💰 Order total:', total, 'Items:', itemsWithPrices.length);

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        id: randomUUID(),
        restaurantId,
        tableId,
        status: 'pending',
        totalAmount: total.toString(),
      })
      .returning();

    console.log('✅ Order created:', order.id);

    // Create order items with all required fields
    const insertedItems = await db.insert(orderItems).values(
      itemsWithPrices.map((item: any) => ({
        id: randomUUID(),
        orderId: order.id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        priceAtOrder: item.priceAtOrder,
        subtotal: item.subtotal,
      }))
    ).returning();

    console.log('✅ Order items created:', insertedItems.length);

    return NextResponse.json({ 
      success: true, 
      order,
      items: insertedItems 
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

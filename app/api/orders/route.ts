import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, menuItems } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { eq, and, inArray } from 'drizzle-orm';

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
      // Handle special free water bottle item
      if (item.menuItemId === 'FREE_WATER_BOTTLE') {
        return {
          menuItemId: 'FREE_WATER_BOTTLE',
          menuItemName: 'Water Bottle 500ML',
          quantity: item.quantity,
          priceAtOrder: '0',
          subtotal: '0',
          customizations: item.customizations || {},
          notes: item.notes || null,
        };
      }

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

    // Check if there's already a waiter assigned to this table
    // (sticky waiter assignment - keeps the same waiter for all orders from a table)
    let assignedWaiterId = null;
    
    if (tableId) {
      console.log('🔍 Checking for existing waiter assignment for tableId:', tableId);
      
      const existingOrders = await db
        .select({
          waiterId: orders.waiterId,
          status: orders.status,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(
          and(
            eq(orders.tableId, tableId),
            inArray(orders.status, ['claimed', 'served'])
          )
        );
      
      console.log('📊 Found existing orders for this table:', existingOrders.length, existingOrders);
      
      if (existingOrders.length > 0 && existingOrders[0]?.waiterId) {
        assignedWaiterId = existingOrders[0].waiterId;
        console.log('📌 Assigning order to existing waiter:', assignedWaiterId);
      } else {
        console.log('✨ No existing waiter for this table, order will be available to all waiters');
      }
    }

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        id: randomUUID(),
        restaurantId,
        tableId,
        waiterId: assignedWaiterId, // Auto-assign if waiter already serving this table
        status: 'pending',
        totalAmount: total.toString(),
      })
      .returning();

    console.log('✅ Order created:', order.id, 'assigned to waiter:', order.waiterId || 'none (available to all)');

    // Create order items with all required fields
    const insertedItems = await db.insert(orderItems).values(
      itemsWithPrices.map((item: any) => ({
        id: randomUUID(),
        orderId: order.id,
        menuItemId: item.menuItemId === 'FREE_WATER_BOTTLE' ? null : item.menuItemId,
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

import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// SUPER ADMINS TABLE
// ============================================
export const superAdmins = pgTable('super_admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
});

// ============================================
// RESTAURANTS TABLE (Simplified)
// ============================================
export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  accessCode: text('access_code').notNull(), // 4-digit code
  
  // Order count tracking
  todayOrdersCount: integer('today_orders_count').default(0),
  currentMonthOrdersCount: integer('current_month_orders_count').default(0),
  lastMonthOrdersCount: integer('last_month_orders_count').default(0),
  
  // Agency info (for monthly reports)
  agencyName: text('agency_name').default('DineQR'),
  agencyLocation: text('agency_location').default('India'),
  agencyContact: text('agency_contact').default('+91-8333027544'),
});

// ============================================
// STAFF TABLE (Simplified)
// ============================================
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull().default('waiter'), // 'admin' or 'waiter'
  accessCode: text('access_code').notNull(), // 4-digit code
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
});

// ============================================
// TABLES TABLE (Simplified)
// ============================================
export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  tableNumber: integer('table_number').notNull(),
  qrCode: text('qr_code').notNull().unique(),
  isActive: boolean('is_active').default(true),
});

// ============================================
// CATEGORIES TABLE (Simplified)
// ============================================
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  displayOrder: integer('display_order').default(0),
});

// ============================================
// MENU ITEMS TABLE (Simplified)
// ============================================
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  foodType: text('food_type').default('veg'), // 'veg', 'non-veg', 'egg'
  isAvailable: boolean('is_available').default(true),
  displayOrder: integer('display_order').default(0),
});

// ============================================
// ORDERS TABLE (Simplified - Auto-deleted on admin confirmation)
// ============================================
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  tableId: uuid('table_id').references(() => tables.id, { onDelete: 'set null' }),
  waiterId: uuid('waiter_id').references(() => staff.id, { onDelete: 'set null' }),
  
  tableNumber: integer('table_number'),
  status: text('status').default('pending'), // 'pending', 'claimed', 'preparing', 'ready', 'served', 'completed', 'payment_collected'
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  // Digital ordering fee
  orderingFee: decimal('ordering_fee', { precision: 10, scale: 2 }).default('7.00'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================
// ORDER ITEMS TABLE
// ============================================
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').references(() => menuItems.id, { onDelete: 'set null' }),
  
  // Snapshot data
  menuItemName: text('menu_item_name').notNull(),
  priceAtOrder: decimal('price_at_order', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
});

// ============================================
// DEMO REQUESTS TABLE (Simplified)
// ============================================
export const demoRequests = pgTable('demo_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantName: text('restaurant_name').notNull(),
  ownerName: text('owner_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address'),
  status: text('status').default('pending'), // 'pending', 'contacted', 'converted', 'rejected'
});

// ============================================
// RELATIONS
// ============================================

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  staff: many(staff),
  tables: many(tables),
  categories: many(categories),
  menuItems: many(menuItems),
  orders: many(orders),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [staff.restaurantId],
    references: [restaurants.id],
  }),
  orders: many(orders),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.restaurantId],
    references: [restaurants.id],
  }),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  waiter: one(staff, {
    fields: [orders.waiterId],
    references: [staff.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

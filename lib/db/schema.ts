import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// SUPER ADMINS (You and your team)
export const superAdmins = pgTable('super_admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
});

// RESTAURANTS (Your clients - multi-tenant)
export const restaurants = pgTable('restaurants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: varchar('logo_url', { length: 500 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  
  // Branding
  primaryColor: varchar('primary_color', { length: 7 }).default('#000000'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#FFFFFF'),
  
  // Settings
  isActive: boolean('is_active').default(true),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata'),
  currency: varchar('currency', { length: 3 }).default('INR'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// SUBSCRIPTIONS (Track payment status)
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, expired, cancelled, grace_period
  
  setupFeePaid: boolean('setup_fee_paid').default(false),
  setupFeeAmount: decimal('setup_fee_amount', { precision: 10, scale: 2 }).default('2499.00'),
  setupFeePaidAt: timestamp('setup_fee_paid_at'),
  
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  nextBillingDate: timestamp('next_billing_date'),
  lastPaymentDate: timestamp('last_payment_date'),
  
  autoRenew: boolean('auto_renew').default(true),
  paymentMethodId: varchar('payment_method_id', { length: 255 }), // Razorpay customer ID
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// PAYMENTS (Track all payments)
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('INR'),
  type: varchar('type', { length: 50 }).notNull(), // setup_fee, annual_renewal
  
  status: varchar('status', { length: 50 }).default('pending'), // pending, success, failed, refunded
  paymentGateway: varchar('payment_gateway', { length: 50 }).default('razorpay'),
  gatewayPaymentId: varchar('gateway_payment_id', { length: 255 }),
  gatewayResponse: jsonb('gateway_response'),
  
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// TABLES (Each restaurant has multiple tables)
export const tables = pgTable('tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  
  tableNumber: varchar('table_number', { length: 20 }).notNull(),
  qrCode: varchar('qr_code', { length: 100 }).notNull().unique(),
  capacity: integer('capacity').default(4),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// MENU CATEGORIES
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// MENU ITEMS
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  
  // Food type: veg, egg, non-veg
  foodType: varchar('food_type', { length: 20 }).default('veg').notNull(),
  
  isAvailable: boolean('is_available').default(true),
  displayOrder: integer('display_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ORDERS
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  tableId: uuid('table_id').notNull().references(() => tables.id),
  
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // pending, claimed, served, completed, cancelled
  
  // Waiter assignment
  waiterId: uuid('waiter_id').references(() => staff.id),
  waiterName: varchar('waiter_name', { length: 255 }),
  claimedAt: timestamp('claimed_at'),
  
  specialInstructions: text('special_instructions'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  
  // Payment details
  paymentMethod: varchar('payment_method', { length: 50 }), // cash, card, upi
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // pending, completed
  paidAt: timestamp('paid_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  servedAt: timestamp('served_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
});

// ORDER ITEMS
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id').notNull().references(() => menuItems.id),
  
  menuItemName: varchar('menu_item_name', { length: 255 }).notNull(), // Store name in case item is deleted
  quantity: integer('quantity').notNull().default(1),
  priceAtOrder: decimal('price_at_order', { precision: 10, scale: 2 }).notNull(), // Store price at time of order
  
  // Customizations chosen by customer
  // Example: {"Size": "Large", "Spice Level": "Hot"}
  customizations: jsonb('customizations').default({}),
  notes: text('notes'),
  
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// STAFF (Restaurant staff - owners, kitchen, waiters)
export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id').notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }), // Nullable - not required for access code auth
  passwordHash: varchar('password_hash', { length: 255 }), // Nullable - not required for access code auth
  accessCode: varchar('access_code', { length: 4 }), // 4-digit PIN for quick login
  role: varchar('role', { length: 50 }).notNull(), // owner, admin, kitchen, waiter
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
});

// RELATIONS
export const restaurantsRelations = relations(restaurants, ({ many, one }) => ({
  subscription: one(subscriptions, {
    fields: [restaurants.id],
    references: [subscriptions.restaurantId],
  }),
  tables: many(tables),
  categories: many(categories),
  menuItems: many(menuItems),
  orders: many(orders),
  staff: many(staff),
  payments: many(payments),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [subscriptions.restaurantId],
    references: [restaurants.id],
  }),
  payments: many(payments),
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

export const staffRelations = relations(staff, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [staff.restaurantId],
    references: [restaurants.id],
  }),
  orders: many(orders),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [payments.restaurantId],
    references: [restaurants.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

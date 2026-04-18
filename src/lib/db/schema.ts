import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  date,
  time,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  passwordHash: text('password_hash'), // Optional now as we might use accounts
  name: text('name').notNull(),
  image: text('image'), // For Better-Auth
  farmName: text('farm_name'),
  farmLogoUrl: text('farm_logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const usersRelations = relations(users, ({ many }) => ({
  crops: many(crops),
  suppliers: many(suppliers),
  customers: many(customers),
  sales: many(sales),
  expenses: many(expenses),
  cropSeasons: many(cropSeasons),
  cropPlans: many(cropPlans),
  trees: many(trees),
  reminders: many(reminders),
  flocks: many(flocks),
}))

// Crops
export const crops = pgTable('crops', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  variety: text('variety'),
  category: text('category').notNull(), // vegetable, fruit, herb, grain
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const cropsRelations = relations(crops, ({ one, many }) => ({
  user: one(users, {
    fields: [crops.userId],
    references: [users.id],
  }),
  seedBatches: many(seedBatches),
  plantingLogs: many(plantingLogs),
  purchasedSeedlings: many(purchasedSeedlings),
  cropPlans: many(cropPlans),
}))

// Suppliers
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  user: one(users, {
    fields: [suppliers.userId],
    references: [users.id],
  }),
  seedBatches: many(seedBatches),
  inputInventory: many(inputInventory),
  purchasedSeedlings: many(purchasedSeedlings),
  expenses: many(expenses),
}))

// Seed Batches
export const seedBatches = pgTable(
  'seed_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cropId: uuid('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'restrict' }),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    batchCode: text('batch_code').notNull().unique(),
    purchaseDate: date('purchase_date'),
    initialQuantity: decimal('initial_quantity', { precision: 10, scale: 2 }).notNull(),
    currentQuantity: decimal('current_quantity', { precision: 10, scale: 2 }).notNull(),
    quantityUnit: text('quantity_unit').notNull(), // seeds, grams, kg
    costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    organicCertified: text('organic_certified'), // certified, organic, untreated, conventional, unknown
    sourceType: text('source_type'), // purchased, self_produced
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkQuantities: check('chk_quantities', sql`${table.currentQuantity} >= 0`),
    checkQuantityConsistency: check(
      'chk_quantity_consistency',
      sql`${table.currentQuantity} <= ${table.initialQuantity}`
    ),
  })
)

export const seedBatchesRelations = relations(seedBatches, ({ one, many }) => ({
  user: one(users, {
    fields: [seedBatches.userId],
    references: [users.id],
  }),
  crop: one(crops, {
    fields: [seedBatches.cropId],
    references: [crops.id],
  }),
  supplier: one(suppliers, {
    fields: [seedBatches.supplierId],
    references: [suppliers.id],
  }),
  plantingLogs: many(plantingLogs),
  seedlingProductionLogs: many(seedlingProductionLogs),
}))

// Input Inventory
export const inputInventory = pgTable(
  'input_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // fertilizer, pesticide, soil_amendment, tool, other
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    purchaseDate: date('purchase_date'),
    initialQuantity: decimal('initial_quantity', { precision: 10, scale: 2 }),
    currentQuantity: decimal('current_quantity', { precision: 10, scale: 2 }).notNull(),
    quantityUnit: text('quantity_unit').notNull(), // kg, L, bags, pieces
    costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    minimumStockLevel: decimal('minimum_stock_level', { precision: 10, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkInputQuantity: check('chk_input_quantity', sql`${table.currentQuantity} >= 0`),
  })
)

export const inputInventoryRelations = relations(inputInventory, ({ one, many }) => ({
  user: one(users, {
    fields: [inputInventory.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [inputInventory.supplierId],
    references: [suppliers.id],
  }),
  cultivationActivities: many(cultivationActivities),
  cultivationActivityInputs: many(cultivationActivityInputs),
}))

// Purchased Seedlings
export const purchasedSeedlings = pgTable(
  'purchased_seedlings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cropId: uuid('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'restrict' }),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    purchaseDate: date('purchase_date').notNull(),
    quantityPurchased: integer('quantity_purchased').notNull(),
    currentQuantity: integer('current_quantity').notNull(),
    costPerSeedling: decimal('cost_per_seedling', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkSeedlingQuantities: check(
      'chk_seedling_quantities',
      sql`${table.currentQuantity} >= 0 AND ${table.currentQuantity} <= ${table.quantityPurchased}`
    ),
  })
)

export const purchasedSeedlingsRelations = relations(purchasedSeedlings, ({ one, many }) => ({
  user: one(users, {
    fields: [purchasedSeedlings.userId],
    references: [users.id],
  }),
  crop: one(crops, {
    fields: [purchasedSeedlings.cropId],
    references: [crops.id],
  }),
  supplier: one(suppliers, {
    fields: [purchasedSeedlings.supplierId],
    references: [suppliers.id],
  }),
  plantingLogs: many(plantingLogs),
}))

// Plots
export const plots = pgTable('plots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  areaSqm: decimal('area_sqm', { precision: 10, scale: 2 }),
  status: text('status').default('available'), // available, in_use, resting, needs_prep
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const plotsRelations = relations(plots, ({ one, many }) => ({
  user: one(users, {
    fields: [plots.userId],
    references: [users.id],
  }),
  plantingLogs: many(plantingLogs),
  cropPlans: many(cropPlans),
  trees: many(trees),
}))

// Planting Logs
export const plantingLogs = pgTable(
  'planting_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cropId: uuid('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'restrict' }),
    plotId: uuid('plot_id').references(() => plots.id, { onDelete: 'set null' }),
    plantingSource: text('planting_source').notNull(), // direct_sow, self_produced, purchased
    seedBatchId: uuid('seed_batch_id').references(() => seedBatches.id, { onDelete: 'set null' }),
    selfProducedSeedlingId: uuid('self_produced_seedling_id').references(
      () => seedlingProductionLogs.id,
      { onDelete: 'set null' }
    ),
    purchasedSeedlingId: uuid('purchased_seedling_id').references(() => purchasedSeedlings.id, {
      onDelete: 'set null',
    }),
    plantingDate: date('planting_date').notNull(),
    quantityPlanted: decimal('quantity_planted', { precision: 10, scale: 2 }).notNull(),
    quantityUnit: text('quantity_unit').notNull(),
    expectedHarvestDate: date('expected_harvest_date'),
    actualHarvestDate: date('actual_harvest_date'),
    status: text('status').default('active'), // active, harvested, failed, completed
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkHarvestDates: check(
      'chk_harvest_dates',
      sql`${table.actualHarvestDate} IS NULL OR ${table.actualHarvestDate} >= ${table.plantingDate}`
    ),
  })
)

export const plantingLogsRelations = relations(plantingLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [plantingLogs.userId],
    references: [users.id],
  }),
  crop: one(crops, {
    fields: [plantingLogs.cropId],
    references: [crops.id],
  }),
  plot: one(plots, {
    fields: [plantingLogs.plotId],
    references: [plots.id],
  }),
  seedBatch: one(seedBatches, {
    fields: [plantingLogs.seedBatchId],
    references: [seedBatches.id],
  }),
  purchasedSeedling: one(purchasedSeedlings, {
    fields: [plantingLogs.purchasedSeedlingId],
    references: [purchasedSeedlings.id],
  }),
  cultivationActivities: many(cultivationActivities),
  cultivationActivityPlantings: many(cultivationActivityPlantings),
  harvestLogs: many(harvestLogs),
  reminders: many(reminders),
}))

// Cultivation Activity Plantings (junction: activity → many plantings)
export const cultivationActivityPlantings = pgTable('cultivation_activity_plantings', {
  id: uuid('id').primaryKey().defaultRandom(),
  cultivationActivityId: uuid('cultivation_activity_id')
    .notNull()
    .references(() => cultivationActivities.id, { onDelete: 'cascade' }),
  plantingLogId: uuid('planting_log_id')
    .notNull()
    .references(() => plantingLogs.id, { onDelete: 'cascade' }),
})

export const cultivationActivityPlantingsRelations = relations(
  cultivationActivityPlantings,
  ({ one }) => ({
    cultivationActivity: one(cultivationActivities, {
      fields: [cultivationActivityPlantings.cultivationActivityId],
      references: [cultivationActivities.id],
    }),
    plantingLog: one(plantingLogs, {
      fields: [cultivationActivityPlantings.plantingLogId],
      references: [plantingLogs.id],
    }),
  })
)

// Cultivation Activity Trees (junction: activity → many trees)
export const cultivationActivityTrees = pgTable('cultivation_activity_trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  cultivationActivityId: uuid('cultivation_activity_id')
    .notNull()
    .references(() => cultivationActivities.id, { onDelete: 'cascade' }),
  treeId: uuid('tree_id')
    .notNull()
    .references(() => trees.id, { onDelete: 'cascade' }),
})

export const cultivationActivityTreesRelations = relations(cultivationActivityTrees, ({ one }) => ({
  cultivationActivity: one(cultivationActivities, {
    fields: [cultivationActivityTrees.cultivationActivityId],
    references: [cultivationActivities.id],
  }),
  tree: one(trees, {
    fields: [cultivationActivityTrees.treeId],
    references: [trees.id],
  }),
}))

// Cultivation Activity Inputs (junction: activity → many inputs)
export const cultivationActivityInputs = pgTable('cultivation_activity_inputs', {
  id: uuid('id').primaryKey().defaultRandom(),
  cultivationActivityId: uuid('cultivation_activity_id')
    .notNull()
    .references(() => cultivationActivities.id, { onDelete: 'cascade' }),
  inputInventoryId: uuid('input_inventory_id')
    .notNull()
    .references(() => inputInventory.id, { onDelete: 'cascade' }),
  quantityUsed: decimal('quantity_used', { precision: 10, scale: 2 }),
  quantityUnit: text('quantity_unit'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
})

export const cultivationActivityInputsRelations = relations(
  cultivationActivityInputs,
  ({ one }) => ({
    cultivationActivity: one(cultivationActivities, {
      fields: [cultivationActivityInputs.cultivationActivityId],
      references: [cultivationActivities.id],
    }),
    inputInventory: one(inputInventory, {
      fields: [cultivationActivityInputs.inputInventoryId],
      references: [inputInventory.id],
    }),
  })
)

// Cultivation Activities
export const cultivationActivities = pgTable('cultivation_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plantingLogId: uuid('planting_log_id').references(() => plantingLogs.id, {
    onDelete: 'set null',
  }),
  activityType: text('activity_type').notNull(), // watering, fertilizing, pest_control, weeding, pruning, other
  activityDate: date('activity_date').notNull(),
  inputInventoryId: uuid('input_inventory_id').references(() => inputInventory.id, {
    onDelete: 'set null',
  }),
  quantityUsed: decimal('quantity_used', { precision: 10, scale: 2 }),
  quantityUnit: text('quantity_unit'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const cultivationActivitiesRelations = relations(cultivationActivities, ({ one, many }) => ({
  user: one(users, {
    fields: [cultivationActivities.userId],
    references: [users.id],
  }),
  plantingLog: one(plantingLogs, {
    fields: [cultivationActivities.plantingLogId],
    references: [plantingLogs.id],
  }),
  inputInventory: one(inputInventory, {
    fields: [cultivationActivities.inputInventoryId],
    references: [inputInventory.id],
  }),
  activityPlantings: many(cultivationActivityPlantings),
  activityInputs: many(cultivationActivityInputs),
  activityTrees: many(cultivationActivityTrees),
}))

// Harvest Logs
export const harvestLogs = pgTable(
  'harvest_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plantingLogId: uuid('planting_log_id')
      .notNull()
      .references(() => plantingLogs.id, { onDelete: 'cascade' }),
    harvestDate: date('harvest_date').notNull(),
    quantityHarvested: decimal('quantity_harvested', { precision: 10, scale: 2 }).notNull(),
    quantityUnit: text('quantity_unit').notNull(), // kg, pieces, bunches, etc.
    currentStock: decimal('current_stock', { precision: 10, scale: 2 }).notNull(), // Available for sale
    qualityGrade: text('quality_grade'), // A, B, C, Premium, Standard
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkHarvestQuantities: check(
      'chk_harvest_quantities',
      sql`${table.quantityHarvested} > 0 AND ${table.currentStock} >= 0 AND ${table.currentStock} <= ${table.quantityHarvested}`
    ),
  })
)

export const harvestLogsRelations = relations(harvestLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [harvestLogs.userId],
    references: [users.id],
  }),
  plantingLog: one(plantingLogs, {
    fields: [harvestLogs.plantingLogId],
    references: [plantingLogs.id],
  }),
  saleItems: many(saleItems),
}))

// Seedling Production Logs
export const seedlingProductionLogs = pgTable(
  'seedling_production_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seedBatchId: uuid('seed_batch_id')
      .notNull()
      .references(() => seedBatches.id, { onDelete: 'restrict' }),
    cropId: uuid('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'restrict' }),
    sowingDate: date('sowing_date').notNull(),
    quantitySown: decimal('quantity_sown', { precision: 10, scale: 2 }).notNull(),
    sowingUnit: text('sowing_unit').notNull(),
    nurseryLocation: text('nursery_location'),
    expectedSeedlings: integer('expected_seedlings'),
    actualSeedlingsProduced: integer('actual_seedlings_produced').default(0),
    currentSeedlingsAvailable: integer('current_seedlings_available').default(0),
    readyForTransplantDate: date('ready_for_transplant_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkSeedlingProduction: check(
      'chk_seedling_production',
      sql`${table.currentSeedlingsAvailable} >= 0 AND ${table.currentSeedlingsAvailable} <= ${table.actualSeedlingsProduced} AND ${table.actualSeedlingsProduced} >= 0`
    ),
  })
)

export const seedlingProductionLogsRelations = relations(seedlingProductionLogs, ({ one }) => ({
  user: one(users, {
    fields: [seedlingProductionLogs.userId],
    references: [users.id],
  }),
  seedBatch: one(seedBatches, {
    fields: [seedlingProductionLogs.seedBatchId],
    references: [seedBatches.id],
  }),
  crop: one(crops, {
    fields: [seedlingProductionLogs.cropId],
    references: [crops.id],
  }),
}))

// Customers
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  customerType: text('customer_type'), // individual, business
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  sales: many(sales),
}))

// Sales
export const sales = pgTable(
  'sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    saleDate: date('sale_date').notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    paymentStatus: text('payment_status').default('pending'), // pending, paid, partial, overdue
    paymentMethod: text('payment_method'), // cash, bank_transfer, check, card
    amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkAmounts: check(
      'chk_amounts',
      sql`${table.totalAmount} >= 0 AND ${table.amountPaid} >= 0 AND ${table.amountPaid} <= ${table.totalAmount}`
    ),
  })
)

export const salesRelations = relations(sales, ({ one, many }) => ({
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  saleItems: many(saleItems),
}))

// Sale Items
export const saleItems = pgTable(
  'sale_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    harvestLogId: uuid('harvest_log_id').references(() => harvestLogs.id, { onDelete: 'set null' }),
    productName: text('product_name').notNull(),
    productDescription: text('product_description'),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: text('unit').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    checkSaleItemAmounts: check(
      'chk_sale_item_amounts',
      sql`${table.quantity} > 0 AND ${table.unitPrice} >= 0 AND ${table.discountPercent} >= 0 AND ${table.discountPercent} <= 100 AND ${table.discountAmount} >= 0 AND ${table.subtotal} >= 0`
    ),
  })
)

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  harvestLog: one(harvestLogs, {
    fields: [saleItems.harvestLogId],
    references: [harvestLogs.id],
  }),
}))

// Expenses
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expenseDate: date('expense_date').notNull(),
    category: text('category').notNull(), // seeds, fertilizer, pesticide, feed, labor, equipment, fuel, maintenance, utilities, other
    subcategory: text('subcategory'),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    paymentMethod: text('payment_method'),
    receiptUrl: text('receipt_url'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkExpenseAmount: check('chk_expense_amount', sql`${table.amount} > 0`),
  })
)

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [expenses.supplierId],
    references: [suppliers.id],
  }),
}))

// Crop Seasons
export const cropSeasons = pgTable(
  'crop_seasons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // Spring 2025, Summer 2025, etc.
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkSeasonDates: check('chk_season_dates', sql`${table.endDate} > ${table.startDate}`),
  })
)

export const cropSeasonsRelations = relations(cropSeasons, ({ one, many }) => ({
  user: one(users, {
    fields: [cropSeasons.userId],
    references: [users.id],
  }),
  cropPlans: many(cropPlans),
}))

// Crop Plans
export const cropPlans = pgTable(
  'crop_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    seasonId: uuid('season_id').references(() => cropSeasons.id, { onDelete: 'set null' }),
    cropId: uuid('crop_id')
      .notNull()
      .references(() => crops.id, { onDelete: 'restrict' }),
    plotId: uuid('plot_id').references(() => plots.id, { onDelete: 'set null' }),
    plannedPlantingDate: date('planned_planting_date'),
    plannedHarvestDate: date('planned_harvest_date'),
    targetQuantity: decimal('target_quantity', { precision: 10, scale: 2 }),
    targetUnit: text('target_unit'),
    estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
    status: text('status').default('planned'), // planned, in_progress, completed, cancelled
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkPlanDates: check(
      'chk_plan_dates',
      sql`${table.plannedHarvestDate} IS NULL OR ${table.plannedPlantingDate} IS NULL OR ${table.plannedHarvestDate} > ${table.plannedPlantingDate}`
    ),
  })
)

export const cropPlansRelations = relations(cropPlans, ({ one }) => ({
  user: one(users, {
    fields: [cropPlans.userId],
    references: [users.id],
  }),
  season: one(cropSeasons, {
    fields: [cropPlans.seasonId],
    references: [cropSeasons.id],
  }),
  crop: one(crops, {
    fields: [cropPlans.cropId],
    references: [crops.id],
  }),
  plot: one(plots, {
    fields: [cropPlans.plotId],
    references: [plots.id],
  }),
}))

// Trees
export const trees = pgTable('trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  identifier: text('identifier').notNull(), // T-001, Olive-North-1, etc.
  species: text('species').notNull(),
  variety: text('variety'),
  plantingDate: date('planting_date'),
  plotId: uuid('plot_id').references(() => plots.id, { onDelete: 'set null' }),
  locationDescription: text('location_description'),
  status: text('status').default('healthy'), // healthy, sick, dead, removed
  healthNotes: text('health_notes'),
  lastHarvestDate: date('last_harvest_date'),
  estimatedAnnualYield: decimal('estimated_annual_yield', { precision: 10, scale: 2 }),
  yieldUnit: text('yield_unit'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const treesRelations = relations(trees, ({ one, many }) => ({
  user: one(users, {
    fields: [trees.userId],
    references: [users.id],
  }),
  plot: one(plots, {
    fields: [trees.plotId],
    references: [plots.id],
  }),
  reminders: many(reminders),
  cultivationActivityTrees: many(cultivationActivityTrees),
}))

// Reminders
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  plantingLogId: uuid('planting_log_id').references(() => plantingLogs.id, {
    onDelete: 'set null',
  }),
  flockId: uuid('flock_id').references(() => flocks.id, { onDelete: 'set null' }),
  treeId: uuid('tree_id').references(() => trees.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  reminderDate: date('reminder_date').notNull(),
  reminderTime: time('reminder_time'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
  plantingLog: one(plantingLogs, {
    fields: [reminders.plantingLogId],
    references: [plantingLogs.id],
  }),
  flock: one(flocks, {
    fields: [reminders.flockId],
    references: [flocks.id],
  }),
  tree: one(trees, {
    fields: [reminders.treeId],
    references: [trees.id],
  }),
}))

// Supplier Invoices
export const supplierInvoices = pgTable('supplier_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date'),
  status: text('status').notNull().default('draft'), // draft, processed
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }),

  // Tax fields
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }), // e.g., 19.00 for 19%
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),

  // Additional costs and discounts
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),

  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),

  // Payment tracking
  paymentStatus: text('payment_status').default('unpaid'), // unpaid, partial, paid
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one, many }) => ({
  user: one(users, {
    fields: [supplierInvoices.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierInvoices.supplierId],
    references: [suppliers.id],
  }),
  items: many(supplierInvoiceItems),
  payments: many(invoicePayments),
  auditLog: many(invoiceAuditLog),
}))

// Supplier Invoice Items
export const supplierInvoiceItems = pgTable('supplier_invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => supplierInvoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull(), // kg, L, bags, pieces, bottles, etc.
  pricePerUnit: decimal('price_per_unit', { precision: 10, scale: 2 }).notNull(),

  // Discount fields
  discountType: text('discount_type'), // 'percentage' or 'amount'
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),

  itemQtyPerPackage: decimal('item_qty_per_package', { precision: 10, scale: 4 }),
  itemUnit: text('item_unit'),
  lineTotal: decimal('line_total', { precision: 10, scale: 2 }).notNull(),
  category: text('category'), // seeds, fertilizer, pesticide, equipment, other
  createdInventoryId: uuid('created_inventory_id'), // Link to input_inventory item created
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const supplierInvoiceItemsRelations = relations(supplierInvoiceItems, ({ one }) => ({
  invoice: one(supplierInvoices, {
    fields: [supplierInvoiceItems.invoiceId],
    references: [supplierInvoices.id],
  }),
  createdInventory: one(inputInventory, {
    fields: [supplierInvoiceItems.createdInventoryId],
    references: [inputInventory.id],
  }),
}))

// Invoice Payments
export const invoicePayments = pgTable('invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => supplierInvoices.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  paymentDate: date('payment_date').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method'), // cash, bank_transfer, check, card
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const invoicePaymentsRelations = relations(invoicePayments, ({ one }) => ({
  invoice: one(supplierInvoices, {
    fields: [invoicePayments.invoiceId],
    references: [supplierInvoices.id],
  }),
  user: one(users, {
    fields: [invoicePayments.userId],
    references: [users.id],
  }),
}))

// Invoice Audit Log
export const invoiceAuditLog = pgTable('invoice_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => supplierInvoices.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // created, updated, processed, unprocessed, payment_added
  changes: text('changes'), // JSON string of what changed
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

export const invoiceAuditLogRelations = relations(invoiceAuditLog, ({ one }) => ({
  invoice: one(supplierInvoices, {
    fields: [invoiceAuditLog.invoiceId],
    references: [supplierInvoices.id],
  }),
  user: one(users, {
    fields: [invoiceAuditLog.userId],
    references: [users.id],
  }),
}))

// Poultry Management

// Flocks
export const flocks = pgTable(
  'flocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // chicken, duck, turkey, goose, quail
    breed: text('breed'),
    purpose: text('purpose').notNull(), // layers, broilers, dual_purpose
    initialCount: integer('initial_count').notNull(),
    currentCount: integer('current_count').notNull(),
    dateAcquired: date('date_acquired').notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    costPerBird: decimal('cost_per_bird', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    housingLocation: text('housing_location'),
    notes: text('notes'),
    status: text('status').notNull().default('active'), // active, sold, depleted
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkFlockCount: check('chk_flock_count', sql`${table.currentCount} >= 0`),
  })
)

export const flocksRelations = relations(flocks, ({ one, many }) => ({
  user: one(users, {
    fields: [flocks.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [flocks.supplierId],
    references: [suppliers.id],
  }),
  eggProduction: many(eggProduction),
  mortalityRecords: many(mortalityRecords),
  healthRecords: many(healthRecords),
  feedUsageRecords: many(feedUsageRecords),
  processingRecords: many(broilerProcessingRecords),
}))

// Poultry Feed Inventory
export const poultryFeedInventory = pgTable(
  'poultry_feed_inventory',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    feedType: text('feed_type').notNull(), // starter, grower, layer, finisher
    brand: text('brand'),
    description: text('description'),
    purchaseDate: date('purchase_date'),
    supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
    initialQuantity: decimal('initial_quantity', { precision: 10, scale: 2 }).notNull(),
    currentQuantity: decimal('current_quantity', { precision: 10, scale: 2 }).notNull(),
    quantityUnit: text('quantity_unit').notNull(), // kg, bags, lbs
    costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    expiryDate: date('expiry_date'),
    batchNumber: text('batch_number'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    checkFeedQuantities: check('chk_feed_quantities', sql`${table.currentQuantity} >= 0`),
    checkFeedQuantityConsistency: check(
      'chk_feed_quantity_consistency',
      sql`${table.currentQuantity} <= ${table.initialQuantity}`
    ),
  })
)

export const poultryFeedInventoryRelations = relations(poultryFeedInventory, ({ one, many }) => ({
  user: one(users, {
    fields: [poultryFeedInventory.userId],
    references: [users.id],
  }),
  supplier: one(suppliers, {
    fields: [poultryFeedInventory.supplierId],
    references: [suppliers.id],
  }),
  feedUsageRecords: many(feedUsageRecords),
}))

// Egg Production
export const eggProduction = pgTable('egg_production', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flockId: uuid('flock_id')
    .notNull()
    .references(() => flocks.id, { onDelete: 'cascade' }),
  collectionDate: date('collection_date').notNull(),
  eggsCollected: integer('eggs_collected').notNull(),
  eggsCracked: integer('eggs_cracked').default(0),
  eggsSmall: integer('eggs_small').default(0),
  eggsMedium: integer('eggs_medium').default(0),
  eggsLarge: integer('eggs_large').default(0),
  eggsXLarge: integer('eggs_x_large').default(0),
  notes: text('notes'),
  currentStock: integer('current_stock').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const eggProductionRelations = relations(eggProduction, ({ one }) => ({
  user: one(users, {
    fields: [eggProduction.userId],
    references: [users.id],
  }),
  flock: one(flocks, {
    fields: [eggProduction.flockId],
    references: [flocks.id],
  }),
}))

// Mortality Records
export const mortalityRecords = pgTable('mortality_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flockId: uuid('flock_id')
    .notNull()
    .references(() => flocks.id, { onDelete: 'cascade' }),
  recordDate: date('record_date').notNull(),
  count: integer('count').notNull(),
  cause: text('cause'), // disease, predator, old_age, accident, unknown
  symptoms: text('symptoms'),
  actionTaken: text('action_taken'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const mortalityRecordsRelations = relations(mortalityRecords, ({ one }) => ({
  user: one(users, {
    fields: [mortalityRecords.userId],
    references: [users.id],
  }),
  flock: one(flocks, {
    fields: [mortalityRecords.flockId],
    references: [flocks.id],
  }),
}))

// Health Records
export const healthRecords = pgTable('health_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flockId: uuid('flock_id')
    .notNull()
    .references(() => flocks.id, { onDelete: 'cascade' }),
  recordDate: date('record_date').notNull(),
  recordType: text('record_type').notNull(), // vaccination, treatment, observation, deworming
  description: text('description').notNull(),
  productUsed: text('product_used'),
  dosage: text('dosage'),
  administeredBy: text('administered_by'),
  birdsAffected: integer('birds_affected'),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  nextDueDate: date('next_due_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  user: one(users, {
    fields: [healthRecords.userId],
    references: [users.id],
  }),
  flock: one(flocks, {
    fields: [healthRecords.flockId],
    references: [flocks.id],
  }),
}))

// Feed Usage Records
export const feedUsageRecords = pgTable('feed_usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flockId: uuid('flock_id')
    .notNull()
    .references(() => flocks.id, { onDelete: 'cascade' }),
  feedId: uuid('feed_id')
    .notNull()
    .references(() => poultryFeedInventory.id, { onDelete: 'restrict' }),
  usageDate: date('usage_date').notNull(),
  quantityUsed: decimal('quantity_used', { precision: 10, scale: 2 }).notNull(),
  quantityUnit: text('quantity_unit').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const feedUsageRecordsRelations = relations(feedUsageRecords, ({ one }) => ({
  user: one(users, {
    fields: [feedUsageRecords.userId],
    references: [users.id],
  }),
  flock: one(flocks, {
    fields: [feedUsageRecords.flockId],
    references: [flocks.id],
  }),
  feed: one(poultryFeedInventory, {
    fields: [feedUsageRecords.feedId],
    references: [poultryFeedInventory.id],
  }),
}))

// Broiler Processing Records — tracks when a broiler flock is processed/sold
export const broilerProcessingRecords = pgTable('broiler_processing_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  flockId: uuid('flock_id')
    .notNull()
    .references(() => flocks.id, { onDelete: 'cascade' }),
  processingDate: date('processing_date').notNull(),
  birdsProcessed: integer('birds_processed').notNull(),
  avgWeightKg: decimal('avg_weight_kg', { precision: 10, scale: 3 }), // avg live weight per bird
  totalWeightKg: decimal('total_weight_kg', { precision: 10, scale: 2 }), // total live weight
  pricePerKg: decimal('price_per_kg', { precision: 10, scale: 2 }), // sale price per kg
  totalRevenue: decimal('total_revenue', { precision: 10, scale: 2 }), // total sale revenue
  processingCost: decimal('processing_cost', { precision: 10, scale: 2 }).default('0'), // slaughterhouse fees
  transportCost: decimal('transport_cost', { precision: 10, scale: 2 }).default('0'),
  otherCosts: decimal('other_costs', { precision: 10, scale: 2 }).default('0'),
  buyerName: text('buyer_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const broilerProcessingRecordsRelations = relations(broilerProcessingRecords, ({ one }) => ({
  user: one(users, {
    fields: [broilerProcessingRecords.userId],
    references: [users.id],
  }),
  flock: one(flocks, {
    fields: [broilerProcessingRecords.flockId],
    references: [flocks.id],
  }),
}))

// ============================================================
// Harvest Orders  Pre-harvest customer order management
// ============================================================

export const harvestOrders = pgTable('harvest_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  orderDate: date('order_date').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const harvestOrdersRelations = relations(harvestOrders, ({ one, many }) => ({
  user: one(users, { fields: [harvestOrders.userId], references: [users.id] }),
  items: many(harvestOrderItems),
}))

export const harvestOrderItems = pgTable('harvest_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => harvestOrders.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  productName: text('product_name').notNull(),
  quantityKg: decimal('quantity_kg', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull().default('kg'),
  pricePerUnit: decimal('price_per_unit', { precision: 10, scale: 2 }),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const harvestOrderItemsRelations = relations(harvestOrderItems, ({ one }) => ({
  order: one(harvestOrders, {
    fields: [harvestOrderItems.orderId],
    references: [harvestOrders.id],
  }),
  customer: one(customers, { fields: [harvestOrderItems.customerId], references: [customers.id] }),
  user: one(users, { fields: [harvestOrderItems.userId], references: [users.id] }),
}))

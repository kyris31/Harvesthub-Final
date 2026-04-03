import { z } from 'zod'

// Flock validation schema
export const flockSchema = z.object({
  name: z.string().min(1, 'Flock name is required'),
  type: z.enum(['chicken', 'duck', 'turkey', 'goose', 'quail'], {
    required_error: 'Poultry type is required',
  }),
  breed: z.string().optional(),
  purpose: z.enum(['layers', 'broilers', 'dual_purpose'], {
    required_error: 'Purpose is required',
  }),
  initialCount: z.coerce.number().int().positive('Initial count must be positive'),
  currentCount: z.coerce.number().int().nonnegative('Current count cannot be negative'),
  dateAcquired: z.string().min(1, 'Date acquired is required'),
  supplierId: z.string().uuid().optional(),
  costPerBird: z.coerce.number().nonnegative().optional(),
  totalCost: z.coerce.number().nonnegative().optional(),
  housingLocation: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'sold', 'depleted']).default('active'),
})

export type FlockFormData = z.infer<typeof flockSchema>

// Poultry Feed validation schema
export const poultryFeedSchema = z.object({
  feedType: z.enum(['starter', 'grower', 'layer', 'finisher'], {
    required_error: 'Feed type is required',
  }),
  brand: z.string().optional(),
  description: z.string().optional(),
  purchaseDate: z.string().optional(),
  supplierId: z.string().uuid().optional().nullable(),
  initialQuantity: z.coerce.number().positive('Initial quantity must be positive'),
  currentQuantity: z.coerce.number().nonnegative('Current quantity cannot be negative'),
  quantityUnit: z.string().min(1, 'Quantity unit is required'),
  costPerUnit: z.coerce.number().nonnegative().optional(),
  totalCost: z.coerce.number().nonnegative().optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  notes: z.string().optional(),
})

export type PoultryFeedFormData = z.infer<typeof poultryFeedSchema>

// Egg Production validation schema
export const eggProductionSchema = z.object({
  flockId: z.string().uuid('Invalid flock selected'),
  collectionDate: z.string().min(1, 'Collection date is required'),
  eggsCollected: z.coerce.number().int().nonnegative('Eggs collected cannot be negative'),
  eggsCracked: z.coerce.number().int().nonnegative().default(0),
  eggsSmall: z.coerce.number().int().nonnegative().default(0),
  eggsMedium: z.coerce.number().int().nonnegative().default(0),
  eggsLarge: z.coerce.number().int().nonnegative().default(0),
  eggsXLarge: z.coerce.number().int().nonnegative().default(0),
  notes: z.string().optional(),
})

export type EggProductionFormData = z.infer<typeof eggProductionSchema>

// Mortality Record validation schema
export const mortalityRecordSchema = z.object({
  flockId: z.string().uuid('Invalid flock selected'),
  recordDate: z.string().min(1, 'Record date is required'),
  count: z.coerce.number().int().positive('Count must be positive'),
  cause: z.enum(['disease', 'predator', 'old_age', 'accident', 'unknown']).optional(),
  symptoms: z.string().optional(),
  actionTaken: z.string().optional(),
  notes: z.string().optional(),
})

export type MortalityRecordFormData = z.infer<typeof mortalityRecordSchema>

// Health Record validation schema
export const healthRecordSchema = z.object({
  flockId: z.string().uuid('Invalid flock selected'),
  recordDate: z.string().min(1, 'Record date is required'),
  recordType: z.enum(['vaccination', 'treatment', 'observation', 'deworming'], {
    required_error: 'Record type is required',
  }),
  description: z.string().min(1, 'Description is required'),
  productUsed: z.string().optional(),
  dosage: z.string().optional(),
  administeredBy: z.string().optional(),
  birdsAffected: z.coerce.number().int().positive().optional(),
  cost: z.coerce.number().nonnegative().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
})

export type HealthRecordFormData = z.infer<typeof healthRecordSchema>

// Feed Usage validation schema
export const feedUsageSchema = z.object({
  flockId: z.string().uuid('Invalid flock selected'),
  feedId: z.string().uuid('Invalid feed selected'),
  usageDate: z.string().min(1, 'Usage date is required'),
  quantityUsed: z.coerce.number().positive('Quantity used must be positive'),
  quantityUnit: z.string().min(1, 'Quantity unit is required'),
  notes: z.string().optional(),
})

export type FeedUsageFormData = z.infer<typeof feedUsageSchema>

// Broiler Processing validation schema
export const broilerProcessingSchema = z.object({
  flockId: z.string().uuid('Invalid flock selected'),
  processingDate: z.string().min(1, 'Processing date is required'),
  birdsProcessed: z.coerce.number().int().positive('Must process at least 1 bird'),
  avgWeightKg: z.coerce.number().positive('Average weight must be positive').optional(),
  totalWeightKg: z.coerce.number().positive('Total weight must be positive').optional(),
  pricePerKg: z.coerce.number().nonnegative('Price per kg cannot be negative').optional(),
  totalRevenue: z.coerce.number().nonnegative('Revenue cannot be negative').optional(),
  processingCost: z.coerce.number().nonnegative().default(0),
  transportCost: z.coerce.number().nonnegative().default(0),
  otherCosts: z.coerce.number().nonnegative().default(0),
  buyerName: z.string().optional(),
  notes: z.string().optional(),
})

export type BroilerProcessingFormData = z.infer<typeof broilerProcessingSchema>

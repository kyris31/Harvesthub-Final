import { z } from 'zod'

// Planting log validation schema
export const plantingLogSchema = z.object({
  cropId: z.string().uuid('Invalid crop ID'),
  plotId: z.string().uuid('Invalid plot ID').optional().nullable(),
  plantingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  quantityPlanted: z.string().min(1, 'Quantity is required'),
  quantityUnit: z.string().min(1, 'Unit is required'),
  expectedHarvestDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  seedBatchId: z.string().uuid().optional().nullable(),
  purchasedSeedlingId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type PlantingLogFormValues = z.infer<typeof plantingLogSchema>

// Harvest log validation schema
export const harvestLogSchema = z.object({
  plantingLogId: z.string().uuid('Invalid planting log ID'),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  quantityHarvested: z.string().min(1, 'Quantity is required'),
  quantityUnit: z.string().min(1, 'Unit is required'),
  currentStock: z.string().optional().nullable(),
  qualityGrade: z.enum(['A', 'B', 'C', 'Premium', 'Standard', '']).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type HarvestLogFormValues = z.infer<typeof harvestLogSchema>

// Seed batch validation schema
export const seedBatchSchema = z.object({
  cropId: z.string().uuid('Invalid crop ID'),
  supplierId: z.string().uuid().optional().nullable(),
  batchCode: z.string().min(1, 'Batch code is required'),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  initialQuantity: z.string().min(1, 'Quantity is required'),
  quantityUnit: z.string().min(1, 'Unit is required'),
  costPerUnit: z.string().optional().nullable(),
  organicCertified: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export type SeedBatchFormValues = z.infer<typeof seedBatchSchema>

// Purchased seedlings validation schema
export const purchasedSeedlingSchema = z.object({
  cropId: z.string().uuid('Invalid crop ID'),
  supplierId: z.string().uuid().optional().nullable(),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  quantityPurchased: z.string().min(1, 'Quantity is required'),
  costPerSeedling: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type PurchasedSeedlingFormValues = z.infer<typeof purchasedSeedlingSchema>

// Plot validation schema
export const plotSchema = z.object({
  name: z.string().min(1, 'Plot name is required'),
  description: z.string().optional().nullable(),
  areaSqm: z.string().optional().nullable(),
  status: z.enum(['available', 'in_use', 'resting', 'needs_prep']).default('available'),
})

export type PlotFormValues = z.infer<typeof plotSchema>

// Common units
export const QUANTITY_UNITS = [
  { value: 'seeds', label: 'Seeds' },
  { value: 'seedlings', label: 'Seedlings' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'bunches', label: 'Bunches' },
  { value: 'trays', label: 'Trays' },
]

export const QUALITY_GRADES = [
  { value: 'Premium', label: 'Premium' },
  { value: 'A', label: 'Grade A' },
  { value: 'B', label: 'Grade B' },
  { value: 'C', label: 'Grade C' },
  { value: 'Standard', label: 'Standard' },
]

export const PLANTING_STATUS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'harvested', label: 'Harvested', color: 'blue' },
  { value: 'failed', label: 'Failed', color: 'red' },
  { value: 'completed', label: 'Completed', color: 'gray' },
]

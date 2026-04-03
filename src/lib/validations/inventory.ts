import { z } from 'zod'

export const seedBatchSchema = z.object({
  cropId: z.string().uuid('Please select a crop'),
  supplierId: z.string().uuid().optional().or(z.literal('')).or(z.literal('self-produced')),
  batchCode: z.string().optional(), // Auto-generated, not required from user
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  initialQuantity: z.string().min(1, 'Initial quantity is required'),
  currentQuantity: z.string().min(1, 'Current quantity is required'),
  quantityUnit: z.string().min(1, 'Unit is required'),
  costPerUnit: z.string().optional().or(z.literal('')),
  totalCost: z.string().optional().or(z.literal('')),
  organicCertified: z.string().optional().or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type SeedBatchFormData = z.infer<typeof seedBatchSchema>

export const inputInventorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  type: z.enum(['fertilizer', 'pesticide', 'soil_amendment', 'tool', 'other']),
  supplierId: z.string().uuid().optional().or(z.literal('')),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  initialQuantity: z.string().optional().or(z.literal('')),
  currentQuantity: z.string().min(1, 'Current quantity is required'),
  quantityUnit: z.string().min(1, 'Unit is required'),
  costPerUnit: z.string().optional().or(z.literal('')),
  totalCost: z.string().optional().or(z.literal('')),
  minimumStockLevel: z.string().optional().or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type InputInventoryFormData = z.infer<typeof inputInventorySchema>

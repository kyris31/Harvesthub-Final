import { z } from 'zod'

export const harvestLogSchema = z.object({
  plantingLogId: z.string().uuid('Please select a planting'),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  quantityHarvested: z.string().min(1, 'Quantity is required'),
  quantityUnit: z.string().min(1, 'Unit is required'),
  currentStock: z.string().min(1, 'Current stock is required'),
  qualityGrade: z
    .string()
    .max(50, 'Quality grade must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type HarvestLogFormData = z.infer<typeof harvestLogSchema>

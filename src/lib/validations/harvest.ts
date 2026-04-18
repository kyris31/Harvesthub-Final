import { z } from 'zod'

export const harvestLogSchema = z
  .object({
    sourceType: z.enum(['planting', 'tree']).default('planting'),
    plantingLogId: z.string().optional().or(z.literal('')),
    treeId: z.string().optional().or(z.literal('')),
    harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    quantityHarvested: z.string().min(1, 'Quantity is required'),
    quantityUnit: z.string().min(1, 'Unit is required'),
    currentStock: z.string().optional().or(z.literal('')),
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
  .refine(
    (data) => {
      if (data.sourceType === 'planting') return !!data.plantingLogId && data.plantingLogId !== ''
      return !!data.treeId && data.treeId !== ''
    },
    { message: 'Please select a planting or tree', path: ['plantingLogId'] }
  )

export type HarvestLogFormData = z.infer<typeof harvestLogSchema>

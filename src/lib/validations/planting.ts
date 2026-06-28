import { z } from 'zod'

export const plantingLogSchema = z
  .object({
    cropId: z.string().uuid('Please select a crop'),
    plotId: z.string().uuid('Please select a plot').optional().or(z.literal('')),
    plantingSource: z.enum(['direct_sow', 'self_produced', 'purchased']),
    seedBatchId: z.string().uuid().optional().or(z.literal('')),
    selfProducedSeedlingId: z.string().uuid().optional().or(z.literal('')),
    purchasedSeedlingId: z.string().uuid().optional().or(z.literal('')),
    plantingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    quantityPlanted: z.string().min(1, 'Quantity is required'),
    quantityUnit: z.string().min(1, 'Unit is required'),
    expectedHarvestDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
      .optional()
      .or(z.literal('')),
    status: z.enum(['active', 'harvested', 'failed', 'completed']).default('active'),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // The seedling batch link is required so reports can attribute harvests/sales
    // back to the source (see Crop Lifecycle Report).
    if (data.plantingSource === 'self_produced' && !data.selfProducedSeedlingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['selfProducedSeedlingId'],
        message: 'Please select the seedling batch this planting came from',
      })
    }
    if (data.plantingSource === 'purchased' && !data.purchasedSeedlingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['purchasedSeedlingId'],
        message: 'Please select the purchased seedling batch this planting came from',
      })
    }
  })

export type PlantingLogFormData = z.infer<typeof plantingLogSchema>

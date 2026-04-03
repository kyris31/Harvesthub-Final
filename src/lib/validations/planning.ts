import { z } from 'zod'

export const seasonSchema = z
  .object({
    name: z.string().min(1, 'Season name is required').max(100),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    notes: z.string().optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

export type SeasonFormData = z.infer<typeof seasonSchema>

export const cropPlanSchema = z.object({
  seasonId: z.string().uuid().optional().nullable(),
  cropId: z.string().uuid('Please select a crop'),
  plotId: z.string().uuid().optional().nullable(),
  plannedPlantingDate: z.string().optional().nullable(),
  plannedHarvestDate: z.string().optional().nullable(),
  targetQuantity: z.coerce.number().positive().optional().nullable(),
  targetUnit: z.string().optional().nullable(),
  estimatedCost: z.coerce.number().nonnegative().optional().nullable(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).default('planned'),
  notes: z.string().optional(),
})

export type CropPlanFormData = z.infer<typeof cropPlanSchema>

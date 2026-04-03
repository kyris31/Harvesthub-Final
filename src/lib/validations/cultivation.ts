import { z } from 'zod'

export const cultivationActivitySchema = z.object({
  plantingLogId: z.string().uuid().optional().or(z.literal('')),
  activityType: z.enum(['watering', 'fertilizing', 'pest_control', 'weeding', 'pruning', 'other']),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  inputInventoryId: z.string().uuid().optional().or(z.literal('')),
  quantityUsed: z.string().optional().or(z.literal('')),
  quantityUnit: z.string().optional().or(z.literal('')),
  cost: z.string().optional().or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type CultivationActivityFormData = z.infer<typeof cultivationActivitySchema>

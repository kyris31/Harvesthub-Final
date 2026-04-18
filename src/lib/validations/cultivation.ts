import { z } from 'zod'

export const cultivationInputItemSchema = z.object({
  inputInventoryId: z.string().uuid(),
  quantityUsed: z.string().optional().or(z.literal('')),
  quantityUnit: z.string().optional().or(z.literal('')),
  cost: z.string().optional().or(z.literal('')),
})

export const cultivationActivitySchema = z.object({
  plantingLogIds: z.array(z.string().uuid()).optional().default([]),
  activityType: z.enum(['watering', 'fertilizing', 'pest_control', 'weeding', 'pruning', 'other']),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  inputs: z.array(cultivationInputItemSchema).optional().default([]),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type CultivationInputItem = z.infer<typeof cultivationInputItemSchema>
export type CultivationActivityFormData = z.infer<typeof cultivationActivitySchema>

import { z } from 'zod'

export const plotSchema = z.object({
  name: z.string().min(1, 'Plot name is required').max(100),
  description: z.string().optional(),
  areaSqm: z.coerce.number().positive('Area must be positive').optional().nullable(),
  status: z.enum(['available', 'in_use', 'resting', 'needs_prep']).default('available'),
})

export type PlotFormData = z.infer<typeof plotSchema>

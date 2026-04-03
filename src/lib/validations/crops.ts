import { z } from 'zod'

export const cropSchema = z.object({
  name: z
    .string()
    .min(1, 'Crop name is required')
    .max(100, 'Name must be less than 100 characters'),
  variety: z
    .string()
    .max(100, 'Variety must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum(['vegetable', 'fruit', 'herb', 'grain'], {
    required_error: 'Please select a category',
  }),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
})

export type CropFormData = z.infer<typeof cropSchema>

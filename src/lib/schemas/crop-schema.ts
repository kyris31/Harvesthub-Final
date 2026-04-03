import { z } from 'zod'

export const cropCategoryEnum = z.enum(['vegetable', 'fruit', 'herb', 'grain'])

export const cropSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  variety: z.string().max(100, 'Variety is too long').optional(),
  category: cropCategoryEnum,
  description: z.string().max(500, 'Description is too long').optional(),
})

export type CropFormValues = z.infer<typeof cropSchema>

export const CROP_CATEGORIES = [
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'herb', label: 'Herb' },
  { value: 'grain', label: 'Grain' },
] as const

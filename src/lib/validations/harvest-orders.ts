import { z } from 'zod'

export const harvestOrderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  orderDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  status: z.enum(['open', 'closed']).default('open'),
})

export const harvestOrderItemSchema = z.object({
  orderId: z.string().uuid(),
  customerId: z.string().uuid().optional().nullable(),
  customerName: z.string().min(1, 'Customer name is required'),
  productName: z.string().min(1, 'Product name is required'),
  quantityKg: z.coerce.number().positive('Quantity must be positive'),
  unit: z.string().default('kg'),
  pricePerUnit: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional(),
})

export type HarvestOrderSchema = z.infer<typeof harvestOrderSchema>
export type HarvestOrderItemSchema = z.infer<typeof harvestOrderItemSchema>

import { z } from 'zod'

// Supplier Invoice Item Schema
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  unit: z.string().min(1, 'Unit is required'),
  pricePerUnit: z.string().min(1, 'Price is required'),
  category: z
    .enum(['seeds', 'fertilizer', 'pesticide', 'equipment', 'other'])
    .optional()
    .or(z.literal('')),
  discountType: z.enum(['percentage', 'amount']).optional().or(z.literal('')),
  discountValue: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>

// Supplier Invoice Schema
export const supplierInvoiceSchema = z.object({
  supplierId: z.string().optional().or(z.literal('')),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  taxRate: z.string().optional().or(z.literal('')),
  shippingCost: z.string().optional().or(z.literal('')),
  discountAmount: z.string().optional().or(z.literal('')),
  items: z.array(invoiceItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional().or(z.literal('')),
})

export type SupplierInvoiceFormData = z.infer<typeof supplierInvoiceSchema>

// Payment Schema
export const paymentSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'card']).optional().or(z.literal('')),
  referenceNumber: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

import { z } from 'zod'

// Customers
export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  customerType: z.enum(['individual', 'business']).default('individual'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional().or(z.literal('')),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type CustomerFormData = z.infer<typeof customerSchema>

// Suppliers
export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  supplierType: z
    .string()
    .max(50, 'Type must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional().or(z.literal('')),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

// Sales
export const saleSchema = z.object({
  customerId: z.string().uuid().optional().or(z.literal('')),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  totalAmount: z.string().min(1, 'Total amount is required'),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue']).default('pending'),
  paymentMethod: z
    .enum(['cash', 'bank_transfer', 'check', 'card', 'other'])
    .optional()
    .or(z.literal('')),
  amountPaid: z.string().default('0'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type SaleFormData = z.infer<typeof saleSchema>

// Expenses
export const expenseSchema = z.object({
  supplierId: z.string().uuid().optional().or(z.literal('')),
  category: z.enum([
    'seeds',
    'fertilizer',
    'pesticide',
    'equipment',
    'labor',
    'utilities',
    'other',
  ]),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be less than 200 characters'),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  amount: z.string().min(1, 'Amount is required'),
  paymentMethod: z
    .enum(['cash', 'bank_transfer', 'check', 'card', 'other'])
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

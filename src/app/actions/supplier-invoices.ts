'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  supplierInvoices,
  supplierInvoiceItems,
  inputInventory,
  expenses,
  invoiceAuditLog,
  invoicePayments,
} from '@/lib/db/schema'
import { and, eq, isNull, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  supplierInvoiceSchema,
  paymentSchema,
  type SupplierInvoiceFormData,
  type PaymentFormData,
} from '@/lib/validations/invoices'

// Helper function to calculate line item discount
function calculateLineDiscount(
  lineSubtotal: number,
  discountType?: string | null,
  discountValue?: string | null
): { discountAmount: number; lineTotal: number } {
  if (!discountType || !discountValue) {
    return { discountAmount: 0, lineTotal: lineSubtotal }
  }

  const value = parseFloat(discountValue)
  const discountAmount = discountType === 'percentage' ? lineSubtotal * (value / 100) : value

  return {
    discountAmount,
    lineTotal: lineSubtotal - discountAmount,
  }
}

// Helper function to calculate invoice totals
function calculateInvoiceTotals(
  items: any[],
  taxRate: string | null | undefined,
  shippingCost: string | null | undefined,
  invoiceDiscount: string | null | undefined
): { subtotal: number; taxAmount: number; total: number } {
  // Calculate subtotal from line items (after line-item discounts)
  const subtotal = items.reduce((sum, item) => {
    const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.pricePerUnit)
    const { lineTotal } = calculateLineDiscount(lineSubtotal, item.discountType, item.discountValue)
    return sum + lineTotal
  }, 0)

  // Apply invoice-level discount
  const discount = parseFloat(invoiceDiscount || '0')
  const afterDiscount = subtotal - discount

  // Calculate tax
  const rate = parseFloat(taxRate || '0')
  const taxAmount = afterDiscount * (rate / 100)

  // Calculate total
  const shipping = parseFloat(shippingCost || '0')
  const total = afterDiscount + taxAmount + shipping

  return { subtotal, taxAmount, total }
}

// Audit logging helper
async function logInvoiceAudit(
  invoiceId: string,
  userId: string,
  action: string,
  changes: any = null
) {
  try {
    await db.insert(invoiceAuditLog).values({
      invoiceId,
      userId,
      action,
      changes: changes ? JSON.stringify(changes) : null,
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

export async function getSupplierInvoices(filters?: { status?: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const whereConditions = [
    eq(supplierInvoices.userId, session.user.id),
    isNull(supplierInvoices.deletedAt),
  ]

  if (filters?.status) {
    whereConditions.push(eq(supplierInvoices.status, filters.status))
  }

  return await db.query.supplierInvoices.findMany({
    where: and(...whereConditions),
    orderBy: [desc(supplierInvoices.invoiceDate)],
    with: {
      supplier: true,
      items: true,
    },
  })
}

export async function getSupplierInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const invoice = await db.query.supplierInvoices.findFirst({
    where: and(
      eq(supplierInvoices.id, id),
      eq(supplierInvoices.userId, session.user.id),
      isNull(supplierInvoices.deletedAt)
    ),
    with: {
      supplier: true,
      items: {
        with: {
          createdInventory: true,
        },
      },
    },
  })

  if (!invoice) throw new Error('Invoice not found')
  return invoice
}

export async function createSupplierInvoice(data: SupplierInvoiceFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = supplierInvoiceSchema.parse(data)

  // Calculate totals with new logic
  const calculations = calculateInvoiceTotals(
    validated.items,
    validated.taxRate,
    validated.shippingCost,
    validated.discountAmount
  )

  const [invoice] = await db
    .insert(supplierInvoices)
    .values({
      userId: session.user.id,
      supplierId: validated.supplierId || null,
      invoiceNumber: validated.invoiceNumber,
      invoiceDate: validated.invoiceDate,
      dueDate: validated.dueDate || null,
      status: 'draft',
      subtotal: calculations.subtotal.toFixed(2),
      taxRate: validated.taxRate || null,
      taxAmount: calculations.taxAmount.toFixed(2),
      shippingCost: validated.shippingCost || '0',
      discountAmount: validated.discountAmount || '0',
      totalAmount: calculations.total.toFixed(2),
      paymentStatus: 'unpaid',
      paidAmount: '0',
      notes: validated.notes || null,
    })
    .returning()

  if (!invoice) {
    throw new Error('Failed to create invoice')
  }

  // Create invoice items with discount calculations
  const itemsToInsert = validated.items.map((item) => {
    const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.pricePerUnit)
    const { discountAmount, lineTotal } = calculateLineDiscount(
      lineSubtotal,
      item.discountType,
      item.discountValue
    )

    return {
      invoiceId: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      discountType: item.discountType || null,
      discountValue: item.discountValue || null,
      discountAmount: discountAmount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      category: item.category || null,
      notes: item.notes || null,
    }
  })

  await db.insert(supplierInvoiceItems).values(itemsToInsert)

  // Log audit entry
  await logInvoiceAudit(invoice.id, session.user.id, 'created')

  revalidatePath('/dashboard/invoices')
  return invoice
}

export async function updateSupplierInvoice(id: string, data: SupplierInvoiceFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = supplierInvoiceSchema.parse(data)

  const existing = await db.query.supplierInvoices.findFirst({
    where: and(
      eq(supplierInvoices.id, id),
      eq(supplierInvoices.userId, session.user.id),
      isNull(supplierInvoices.deletedAt)
    ),
    with: { items: true },
  })

  if (!existing) throw new Error('Invoice not found')

  // Calculate new totals with enhanced logic
  const calculations = calculateInvoiceTotals(
    validated.items,
    validated.taxRate,
    validated.shippingCost,
    validated.discountAmount
  )

  // Update invoice header
  const [updated] = await db
    .update(supplierInvoices)
    .set({
      supplierId: validated.supplierId || null,
      invoiceNumber: validated.invoiceNumber,
      invoiceDate: validated.invoiceDate,
      dueDate: validated.dueDate || null,
      subtotal: calculations.subtotal.toFixed(2),
      taxRate: validated.taxRate || null,
      taxAmount: calculations.taxAmount.toFixed(2),
      shippingCost: validated.shippingCost || '0',
      discountAmount: validated.discountAmount || '0',
      totalAmount: calculations.total.toFixed(2),
      notes: validated.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(supplierInvoices.id, id))
    .returning()

  if (!updated) {
    throw new Error('Failed to update invoice')
  }

  // Delete old items
  await db.delete(supplierInvoiceItems).where(eq(supplierInvoiceItems.invoiceId, id))

  // Create new items with discount calculations
  const itemsToInsert = validated.items.map((item) => {
    const lineSubtotal = parseFloat(item.quantity) * parseFloat(item.pricePerUnit)
    const { discountAmount, lineTotal } = calculateLineDiscount(
      lineSubtotal,
      item.discountType,
      item.discountValue
    )

    return {
      invoiceId: id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      discountType: item.discountType || null,
      discountValue: item.discountValue || null,
      discountAmount: discountAmount.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      category: item.category || null,
      notes: item.notes || null,
    }
  })

  await db.insert(supplierInvoiceItems).values(itemsToInsert)

  // Log audit entry
  await logInvoiceAudit(id, session.user.id, 'updated')

  // If invoice was processed, sync inventory
  if (existing.status === 'processed') {
    await syncInventoryFromInvoice(id)
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
  return updated
}

export async function deleteSupplierInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.supplierInvoices.findFirst({
    where: and(
      eq(supplierInvoices.id, id),
      eq(supplierInvoices.userId, session.user.id),
      isNull(supplierInvoices.deletedAt)
    ),
  })

  if (!existing) throw new Error('Invoice not found')

  // Soft delete
  await db
    .update(supplierInvoices)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(supplierInvoices.id, id))

  revalidatePath('/dashboard/invoices')
}

export async function processInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const invoice = await db.query.supplierInvoices.findFirst({
    where: and(
      eq(supplierInvoices.id, id),
      eq(supplierInvoices.userId, session.user.id),
      isNull(supplierInvoices.deletedAt)
    ),
    with: { items: true },
  })

  if (!invoice) throw new Error('Invoice not found')
  if (invoice.status === 'processed') throw new Error('Invoice already processed')

  // Create input inventory items for each line item
  for (const item of invoice.items) {
    const [inventoryItem] = await db
      .insert(inputInventory)
      .values({
        userId: session.user.id,
        supplierId: invoice.supplierId,
        name: item.description,
        type: item.category || 'other',
        purchaseDate: invoice.invoiceDate,
        initialQuantity: item.quantity,
        currentQuantity: item.quantity,
        quantityUnit: item.unit,
        costPerUnit: item.pricePerUnit,
        totalCost: item.lineTotal,
        notes: item.notes,
      })
      .returning()

    if (!inventoryItem) {
      throw new Error('Failed to create inventory item')
    }

    // Link inventory item back to invoice item
    await db
      .update(supplierInvoiceItems)
      .set({
        createdInventoryId: inventoryItem.id,
      })
      .where(eq(supplierInvoiceItems.id, item.id))
  }

  // Create expense record
  await db.insert(expenses).values({
    userId: session.user.id,
    supplierId: invoice.supplierId,
    category: 'other',
    description: `Invoice ${invoice.invoiceNumber}`,
    expenseDate: invoice.invoiceDate,
    amount: invoice.totalAmount,
    notes: invoice.notes,
  })

  // Update invoice status
  await db
    .update(supplierInvoices)
    .set({
      status: 'processed',
      updatedAt: new Date(),
    })
    .where(eq(supplierInvoices.id, id))

  // Log audit entry
  await logInvoiceAudit(id, session.user.id, 'processed')

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
  revalidatePath('/dashboard/inventory/inputs')
  revalidatePath('/dashboard/expenses')
}

export async function unprocessInvoice(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const invoice = await db.query.supplierInvoices.findFirst({
    where: and(
      eq(supplierInvoices.id, id),
      eq(supplierInvoices.userId, session.user.id),
      isNull(supplierInvoices.deletedAt)
    ),
    with: { items: true },
  })

  if (!invoice) throw new Error('Invoice not found')
  if (invoice.status !== 'processed') throw new Error('Invoice not processed')

  // Delete created inventory items
  for (const item of invoice.items) {
    if (item.createdInventoryId) {
      await db
        .update(inputInventory)
        .set({
          deletedAt: new Date(),
        })
        .where(eq(inputInventory.id, item.createdInventoryId))
    }
  }

  // Delete expense record (find by description matching invoice number)
  await db
    .delete(expenses)
    .where(
      and(
        eq(expenses.userId, session.user.id),
        eq(expenses.description, `Invoice ${invoice.invoiceNumber}`)
      )
    )

  // Update invoice status to draft
  await db
    .update(supplierInvoices)
    .set({
      status: 'draft',
      updatedAt: new Date(),
    })
    .where(eq(supplierInvoices.id, id))

  // Log audit entry
  await logInvoiceAudit(id, session.user.id, 'unprocessed')

  // Clear inventory links
  await db
    .update(supplierInvoiceItems)
    .set({
      createdInventoryId: null,
    })
    .where(eq(supplierInvoiceItems.invoiceId, id))

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${id}`)
  revalidatePath('/dashboard/inventory/inputs')
  revalidatePath('/dashboard/expenses')
}

async function syncInventoryFromInvoice(invoiceId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const invoice = await db.query.supplierInvoices.findFirst({
    where: eq(supplierInvoices.id, invoiceId),
    with: { items: true },
  })

  if (!invoice) return

  // Update existing linked inventory items
  for (const item of invoice.items) {
    if (item.createdInventoryId) {
      await db
        .update(inputInventory)
        .set({
          name: item.description,
          type: item.category || 'other',
          initialQuantity: item.quantity,
          currentQuantity: item.quantity,
          quantityUnit: item.unit,
          costPerUnit: item.pricePerUnit,
          totalCost: item.lineTotal,
          notes: item.notes,
          updatedAt: new Date(),
        })
        .where(eq(inputInventory.id, item.createdInventoryId))
    }
  }

  // Update expense record
  await db
    .update(expenses)
    .set({
      amount: invoice.totalAmount,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(expenses.userId, session.user.id),
        eq(expenses.description, `Invoice ${invoice.invoiceNumber}`)
      )
    )

  revalidatePath('/dashboard/inventory/inputs')
  revalidatePath('/dashboard/expenses')
}

// Payment Tracking Actions

export async function addInvoicePayment(invoiceId: string, data: PaymentFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = paymentSchema.parse(data)

  // Get invoice to verify ownership and get total
  const invoice = await getSupplierInvoice(invoiceId)

  // Create payment record
  const [payment] = await db
    .insert(invoicePayments)
    .values({
      invoiceId,
      userId: session.user.id,
      paymentDate: validated.paymentDate,
      amount: validated.amount,
      paymentMethod: validated.paymentMethod || null,
      referenceNumber: validated.referenceNumber || null,
      notes: validated.notes || null,
    })
    .returning()

  // Calculate new paid amount
  const existingPayments = await db.query.invoicePayments.findMany({
    where: eq(invoicePayments.invoiceId, invoiceId),
  })

  const totalPaid = existingPayments.reduce((sum: number, p) => sum + parseFloat(p.amount), 0)
  const invoiceTotal = parseFloat(invoice.totalAmount)

  // Update payment status
  let newStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid'
  if (totalPaid === 0) {
    newStatus = 'unpaid'
  } else if (totalPaid >= invoiceTotal) {
    newStatus = 'paid'
  } else {
    newStatus = 'partial'
  }

  await db
    .update(supplierInvoices)
    .set({
      paidAmount: totalPaid.toFixed(2),
      paymentStatus: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(supplierInvoices.id, invoiceId))

  // Log audit entry
  await logInvoiceAudit(invoiceId, session.user.id, 'payment_added', {
    amount: validated.amount,
    method: validated.paymentMethod,
    newStatus,
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  return payment
}

export async function getInvoicePayments(invoiceId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  // Verify invoice ownership
  await getSupplierInvoice(invoiceId)

  return await db.query.invoicePayments.findMany({
    where: eq(invoicePayments.invoiceId, invoiceId),
    orderBy: [desc(invoicePayments.paymentDate)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })
}

export async function getInvoiceAuditLog(invoiceId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  // Verify invoice ownership
  await getSupplierInvoice(invoiceId)

  return await db.query.invoiceAuditLog.findMany({
    where: eq(invoiceAuditLog.invoiceId, invoiceId),
    orderBy: [desc(invoiceAuditLog.timestamp)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  })
}

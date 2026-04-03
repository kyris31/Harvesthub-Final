// Payment tracking actions to add at the end of supplier-invoices.ts

import { invoicePayments } from '@/lib/db/schema'
import { paymentSchema, type PaymentFormData } from '@/lib/validations/invoices'

export async function addInvoicePayment(invoiceId: string, data: PaymentFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = paymentSchema.parse(data)

  // Get invoice to verify ownership and get total
  const invoice = await getSupplierInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')

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

  const totalPaid = existingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
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

export async function deleteInvoicePayment(paymentId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  // Get payment to verify ownership
  const payment = await db.query.invoicePayments.findFirst({
    where: eq(invoicePayments.id, paymentId),
  })

  if (!payment) throw new Error('Payment not found')

  // Verify invoice ownership
  const invoice = await getSupplierInvoice(payment.invoiceId)
  if (!invoice) throw new Error('Invoice not found')

  // Delete payment
  await db.delete(invoicePayments).where(eq(invoicePayments.id, paymentId))

  // Recalculate paid amount
  const remainingPayments = await db.query.invoicePayments.findMany({
    where: eq(invoicePayments.invoiceId, payment.invoiceId),
  })

  const totalPaid = remainingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
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
    .where(eq(supplierInvoices.id, payment.invoiceId))

  // Log audit entry
  await logInvoiceAudit(payment.invoiceId, session.user.id, 'payment_deleted', {
    amount: payment.amount,
    newStatus,
  })

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${payment.invoiceId}`)
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

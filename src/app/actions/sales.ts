'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { sales, saleItems, harvestLogs } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { saleSchema, type SaleFormData } from '@/lib/validations/business'

export async function getSales(filters?: { startDate?: string; endDate?: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const whereConditions = [eq(sales.userId, session.user.id), isNull(sales.deletedAt)]

  if (filters?.startDate) whereConditions.push(gte(sales.saleDate, filters.startDate))
  if (filters?.endDate) whereConditions.push(lte(sales.saleDate, filters.endDate))

  return await db.query.sales.findMany({
    where: and(...whereConditions),
    orderBy: [desc(sales.saleDate)],
    with: { customer: true },
  })
}

export async function getSale(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const sale = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
    with: { customer: true },
  })

  if (!sale) throw new Error('Sale not found')
  return sale
}

export async function createSale(data: SaleFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = saleSchema.parse(data)
  const [sale] = await db
    .insert(sales)
    .values({
      ...validated,
      customerId: validated.customerId || null,
      paymentMethod: validated.paymentMethod || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/sales')
  return sale
}

export async function updateSale(id: string, data: SaleFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = saleSchema.parse(data)
  const existing = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
  })

  if (!existing) throw new Error('Sale not found')

  const [updated] = await db
    .update(sales)
    .set({
      ...validated,
      customerId: validated.customerId || null,
      paymentMethod: validated.paymentMethod || null,
      updatedAt: new Date(),
    })
    .where(eq(sales.id, id))
    .returning()

  revalidatePath('/dashboard/sales')
  revalidatePath(`/dashboard/sales/${id}`)
  return updated
}

export async function createSaleWithItems(data: {
  customerId?: string
  saleDate: string
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue'
  paymentMethod?: string
  amountPaid: string
  notes?: string
  items: Array<{
    harvestLogId: string
    quantity: string
    pricePerUnit: string
  }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  // Validate stock availability for all items first
  for (const item of data.items) {
    const harvest = await db.query.harvestLogs.findFirst({
      where: and(eq(harvestLogs.id, item.harvestLogId), eq(harvestLogs.userId, session.user.id)),
    })
    if (!harvest) throw new Error('Harvest record not found')
    const available = parseFloat(harvest.currentStock)
    const requested = parseFloat(item.quantity)
    if (requested > available) {
      throw new Error(`Insufficient stock: only ${available} ${harvest.quantityUnit} available`)
    }
  }

  // Calculate total
  const totalAmount = data.items
    .reduce((sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.pricePerUnit), 0)
    .toFixed(2)

  // Insert the sale
  const [sale] = await db
    .insert(sales)
    .values({
      customerId: data.customerId || null,
      saleDate: data.saleDate,
      totalAmount,
      paymentStatus: data.paymentStatus,
      paymentMethod: data.paymentMethod || null,
      amountPaid: data.amountPaid,
      notes: data.notes || null,
      userId: session.user.id,
    })
    .returning()

  // Insert sale items and decrement harvest stock
  for (const item of data.items) {
    const harvest = await db.query.harvestLogs.findFirst({
      where: eq(harvestLogs.id, item.harvestLogId),
      with: { plantingLog: { with: { crop: true } } },
    })

    const qty = parseFloat(item.quantity)
    const price = parseFloat(item.pricePerUnit)

    await db.insert(saleItems).values({
      saleId: sale.id,
      harvestLogId: item.harvestLogId,
      productName: (harvest as any)?.plantingLog?.crop?.name ?? 'Product',
      quantity: item.quantity,
      unit: harvest?.quantityUnit ?? 'units',
      unitPrice: item.pricePerUnit,
      subtotal: (qty * price).toFixed(2),
    })

    // Decrement currentStock
    await db
      .update(harvestLogs)
      .set({ currentStock: sql`${harvestLogs.currentStock} - ${qty}` })
      .where(eq(harvestLogs.id, item.harvestLogId))
  }

  revalidatePath('/dashboard/sales')
  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/harvest')
  return sale
}

export async function deleteSale(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
  })

  if (!existing) throw new Error('Sale not found')

  await db.update(sales).set({ deletedAt: new Date() }).where(eq(sales.id, id))
  revalidatePath('/dashboard/sales')
}

'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { sales, saleItems, harvestLogs, eggProduction } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getSales(filters?: { startDate?: string; endDate?: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const whereConditions = [eq(sales.userId, session.user.id), isNull(sales.deletedAt)]

  if (filters?.startDate) whereConditions.push(gte(sales.saleDate, filters.startDate))
  if (filters?.endDate) whereConditions.push(lte(sales.saleDate, filters.endDate))

  return await db.query.sales.findMany({
    where: and(...whereConditions),
    orderBy: [desc(sales.saleDate)],
    with: { customer: true, saleItems: true },
  })
}

export async function getSale(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const sale = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
    with: { customer: true, saleItems: true },
  })

  if (!sale) throw new Error('Sale not found')
  return sale
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
    if (item.harvestLogId.startsWith('egg:')) {
      const eggId = item.harvestLogId.slice(4)
      const egg = await db.query.eggProduction.findFirst({
        where: and(eq(eggProduction.id, eggId), eq(eggProduction.userId, session.user.id)),
      })
      if (!egg) throw new Error('Egg production record not found')
      if (egg.collectionDate > data.saleDate) {
        throw new Error('Cannot sell eggs before they were collected')
      }
      const requested = Math.round(parseFloat(item.quantity))
      if (requested > egg.currentStock) {
        throw new Error(`Insufficient egg stock: only ${egg.currentStock} eggs available`)
      }
    } else {
      const harvest = await db.query.harvestLogs.findFirst({
        where: and(eq(harvestLogs.id, item.harvestLogId), eq(harvestLogs.userId, session.user.id)),
      })
      if (!harvest) throw new Error('Harvest record not found')
      if (harvest.harvestDate > data.saleDate) {
        throw new Error('Cannot sell a product before it was harvested')
      }
      const available = parseFloat(harvest.currentStock)
      const requested = parseFloat(item.quantity)
      if (requested > available) {
        throw new Error(`Insufficient stock: only ${available} ${harvest.quantityUnit} available`)
      }
    }
  }

  // Calculate total
  const totalAmount = data.items
    .reduce((sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.pricePerUnit), 0)
    .toFixed(2)

  // A free sale (nothing owed) is settled, never pending
  const isFree = parseFloat(totalAmount) === 0
  const paymentStatus = isFree ? 'paid' : data.paymentStatus
  const amountPaid = isFree ? totalAmount : data.amountPaid

  // Insert the sale
  const [sale] = await db
    .insert(sales)
    .values({
      customerId: data.customerId || null,
      saleDate: data.saleDate,
      totalAmount,
      paymentStatus,
      paymentMethod: data.paymentMethod || null,
      amountPaid,
      notes: data.notes || null,
      userId: session.user.id,
    })
    .returning()

  if (!sale) {
    throw new Error('Failed to create sale')
  }

  // Insert sale items and decrement stock
  for (const item of data.items) {
    const qty = parseFloat(item.quantity)
    const price = parseFloat(item.pricePerUnit)

    if (item.harvestLogId.startsWith('egg:')) {
      const eggId = item.harvestLogId.slice(4)
      const egg = await db.query.eggProduction.findFirst({
        where: eq(eggProduction.id, eggId),
        with: { flock: { columns: { name: true } } },
      })

      await db.insert(saleItems).values({
        saleId: sale.id,
        harvestLogId: null,
        eggProductionId: eggId,
        productName: `Eggs — ${(egg as any)?.flock?.name ?? 'Unknown Flock'}`,
        quantity: item.quantity,
        unit: 'eggs',
        unitPrice: item.pricePerUnit,
        subtotal: (qty * price).toFixed(2),
      })

      await db
        .update(eggProduction)
        .set({ currentStock: sql`${eggProduction.currentStock} - ${Math.round(qty)}` })
        .where(eq(eggProduction.id, eggId))
    } else {
      const harvest = await db.query.harvestLogs.findFirst({
        where: eq(harvestLogs.id, item.harvestLogId),
        with: { plantingLog: { with: { crop: true } } },
      })

      await db.insert(saleItems).values({
        saleId: sale.id,
        harvestLogId: item.harvestLogId,
        productName: (harvest as any)?.plantingLog?.crop?.name ?? 'Product',
        quantity: item.quantity,
        unit: harvest?.quantityUnit ?? 'units',
        unitPrice: item.pricePerUnit,
        subtotal: (qty * price).toFixed(2),
      })

      await db
        .update(harvestLogs)
        .set({ currentStock: sql`${harvestLogs.currentStock} - ${qty}` })
        .where(eq(harvestLogs.id, item.harvestLogId))
    }
  }

  revalidatePath('/dashboard/sales')
  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/harvest')
  return sale
}

export async function updateSaleWithItems(
  id: string,
  data: {
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
  }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
    with: { saleItems: true },
  })
  if (!existing) throw new Error('Sale not found')

  // Stock consumed by this sale's current items, to be credited back before we
  // re-evaluate availability.
  const restoreByHarvest = new Map<string, number>()
  const restoreByEgg = new Map<string, number>()
  for (const old of existing.saleItems) {
    if (old.harvestLogId) {
      restoreByHarvest.set(
        old.harvestLogId,
        (restoreByHarvest.get(old.harvestLogId) ?? 0) + parseFloat(old.quantity)
      )
    } else if (old.eggProductionId) {
      restoreByEgg.set(
        old.eggProductionId,
        (restoreByEgg.get(old.eggProductionId) ?? 0) + Math.round(parseFloat(old.quantity))
      )
    }
  }

  // Validate stock for all new items against availability that includes what
  // this sale previously consumed — before mutating anything.
  for (const item of data.items) {
    if (item.harvestLogId.startsWith('egg:')) {
      const eggId = item.harvestLogId.slice(4)
      const egg = await db.query.eggProduction.findFirst({
        where: and(eq(eggProduction.id, eggId), eq(eggProduction.userId, session.user.id)),
      })
      if (!egg) throw new Error('Egg production record not found')
      if (egg.collectionDate > data.saleDate) {
        throw new Error('Cannot sell eggs before they were collected')
      }
      const available = egg.currentStock + (restoreByEgg.get(eggId) ?? 0)
      const requested = Math.round(parseFloat(item.quantity))
      if (requested > available) {
        throw new Error(`Insufficient egg stock: only ${available} eggs available`)
      }
    } else {
      const harvest = await db.query.harvestLogs.findFirst({
        where: and(eq(harvestLogs.id, item.harvestLogId), eq(harvestLogs.userId, session.user.id)),
      })
      if (!harvest) throw new Error('Harvest record not found')
      if (harvest.harvestDate > data.saleDate) {
        throw new Error('Cannot sell a product before it was harvested')
      }
      const available =
        parseFloat(harvest.currentStock) + (restoreByHarvest.get(item.harvestLogId) ?? 0)
      const requested = parseFloat(item.quantity)
      if (requested > available) {
        throw new Error(`Insufficient stock: only ${available} ${harvest.quantityUnit} available`)
      }
    }
  }

  const totalAmount = data.items
    .reduce((sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.pricePerUnit), 0)
    .toFixed(2)

  // A free sale (nothing owed) is settled, never pending. Never let amountPaid
  // exceed the total or the DB check constraint rejects the row.
  const isFree = parseFloat(totalAmount) === 0
  const paymentStatus = isFree ? 'paid' : data.paymentStatus
  const amountPaid = isFree
    ? totalAmount
    : Math.min(parseFloat(data.amountPaid || '0'), parseFloat(totalAmount)).toFixed(2)

  // Credit back stock from the old items, then drop them.
  for (const old of existing.saleItems) {
    if (old.harvestLogId) {
      await db
        .update(harvestLogs)
        .set({ currentStock: sql`${harvestLogs.currentStock} + ${parseFloat(old.quantity)}` })
        .where(eq(harvestLogs.id, old.harvestLogId))
    } else if (old.eggProductionId) {
      await db
        .update(eggProduction)
        .set({
          currentStock: sql`${eggProduction.currentStock} + ${Math.round(parseFloat(old.quantity))}`,
        })
        .where(eq(eggProduction.id, old.eggProductionId))
    }
  }
  await db.delete(saleItems).where(eq(saleItems.saleId, id))

  // Update the sale row.
  await db
    .update(sales)
    .set({
      customerId: data.customerId || null,
      saleDate: data.saleDate,
      totalAmount,
      paymentStatus,
      paymentMethod: data.paymentMethod || null,
      amountPaid,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(sales.id, id))

  // Re-insert items and decrement stock (mirrors createSaleWithItems).
  for (const item of data.items) {
    const qty = parseFloat(item.quantity)
    const price = parseFloat(item.pricePerUnit)

    if (item.harvestLogId.startsWith('egg:')) {
      const eggId = item.harvestLogId.slice(4)
      const egg = await db.query.eggProduction.findFirst({
        where: eq(eggProduction.id, eggId),
        with: { flock: { columns: { name: true } } },
      })

      await db.insert(saleItems).values({
        saleId: id,
        harvestLogId: null,
        eggProductionId: eggId,
        productName: `Eggs — ${(egg as any)?.flock?.name ?? 'Unknown Flock'}`,
        quantity: item.quantity,
        unit: 'eggs',
        unitPrice: item.pricePerUnit,
        subtotal: (qty * price).toFixed(2),
      })

      await db
        .update(eggProduction)
        .set({ currentStock: sql`${eggProduction.currentStock} - ${Math.round(qty)}` })
        .where(eq(eggProduction.id, eggId))
    } else {
      const harvest = await db.query.harvestLogs.findFirst({
        where: eq(harvestLogs.id, item.harvestLogId),
        with: { plantingLog: { with: { crop: true } } },
      })

      await db.insert(saleItems).values({
        saleId: id,
        harvestLogId: item.harvestLogId,
        productName: (harvest as any)?.plantingLog?.crop?.name ?? 'Product',
        quantity: item.quantity,
        unit: harvest?.quantityUnit ?? 'units',
        unitPrice: item.pricePerUnit,
        subtotal: (qty * price).toFixed(2),
      })

      await db
        .update(harvestLogs)
        .set({ currentStock: sql`${harvestLogs.currentStock} - ${qty}` })
        .where(eq(harvestLogs.id, item.harvestLogId))
    }
  }

  revalidatePath('/dashboard/sales')
  revalidatePath(`/dashboard/sales/${id}`)
  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/harvest')
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

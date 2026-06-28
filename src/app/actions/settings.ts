'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { users, supplierInvoices, inputInventory } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { lineGrossCost } from '@/lib/invoice-cost'

export async function getUserSettings() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const [row] = await db
    .select({ vatRegistered: users.vatRegistered })
    .from(users)
    .where(eq(users.id, session.user.id))

  return { vatRegistered: row?.vatRegistered ?? false }
}

/**
 * Recompute the stored cost of every inventory item created from a processed
 * supplier invoice, applying the given VAT mode. Only cost fields are touched —
 * current quantity (and therefore any consumption) is left untouched.
 */
async function backfillInventoryCosts(userId: string, vatRegistered: boolean): Promise<number> {
  const invoices = await db.query.supplierInvoices.findMany({
    where: and(
      eq(supplierInvoices.userId, userId),
      eq(supplierInvoices.status, 'processed'),
      isNull(supplierInvoices.deletedAt)
    ),
    with: { items: true },
  })

  let updated = 0
  for (const invoice of invoices) {
    const subtotal = parseFloat(invoice.subtotal || '0')
    const tax = parseFloat(invoice.taxAmount || '0')

    for (const item of invoice.items) {
      if (!item.createdInventoryId) continue

      const [invItem] = await db
        .select({ initialQuantity: inputInventory.initialQuantity })
        .from(inputInventory)
        .where(
          and(eq(inputInventory.id, item.createdInventoryId), isNull(inputInventory.deletedAt))
        )

      if (!invItem) continue

      const units = parseFloat(invItem.initialQuantity || '0')
      // Use the line's own VAT; fall back to proportional allocation for older
      // invoices created before per-line tax existed.
      const lineTax =
        item.taxAmount !== null && item.taxAmount !== undefined
          ? parseFloat(item.taxAmount)
          : subtotal > 0
            ? tax * (parseFloat(item.lineTotal) / subtotal)
            : 0
      const lineGross = lineGrossCost(parseFloat(item.lineTotal), lineTax, vatRegistered)
      const costPerUnit = units > 0 ? (lineGross / units).toFixed(6) : '0'

      await db
        .update(inputInventory)
        .set({ costPerUnit, totalCost: lineGross.toFixed(2), updatedAt: new Date() })
        .where(eq(inputInventory.id, item.createdInventoryId))
      updated++
    }
  }

  return updated
}

/**
 * Set the VAT-registration mode and immediately re-cost existing inventory so
 * costs always match the chosen mode (also handles switching modes later).
 */
export async function updateVatRegistration(vatRegistered: boolean) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  await db
    .update(users)
    .set({ vatRegistered, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))

  const updated = await backfillInventoryCosts(session.user.id, vatRegistered)

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/inventory/inputs')
  revalidatePath('/dashboard/cultivation')
  return { updated }
}

/** One-time recalculation using the user's current VAT mode. */
export async function recalculateInventoryCosts() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const [row] = await db
    .select({ vatRegistered: users.vatRegistered })
    .from(users)
    .where(eq(users.id, session.user.id))
  const vatRegistered = row?.vatRegistered ?? false

  const updated = await backfillInventoryCosts(session.user.id, vatRegistered)

  revalidatePath('/dashboard/inventory/inputs')
  revalidatePath('/dashboard/cultivation')
  return { updated }
}

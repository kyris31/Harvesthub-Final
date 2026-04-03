'use server'

import { db } from '@/lib/db'
import { harvestOrders, harvestOrderItems, customers, plantingLogs, trees } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { harvestOrderSchema, harvestOrderItemSchema } from '@/lib/validations/harvest-orders'
import { eq, and, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// ── List all harvest order batches ─────────────────────────────────────────
export async function getHarvestOrders() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.harvestOrders.findMany({
    where: and(eq(harvestOrders.userId, session.user.id), sql`${harvestOrders.deletedAt} IS NULL`),
    with: { items: true },
    orderBy: [desc(harvestOrders.orderDate)],
  })
}

// ── Create a new batch ──────────────────────────────────────────────────────
export async function createHarvestOrder(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = harvestOrderSchema.parse(data)
  const [order] = await db
    .insert(harvestOrders)
    .values({ ...validated, userId: session.user.id })
    .returning()

  revalidatePath('/dashboard/harvest-orders')
  return order
}

// ── Delete a harvest order batch ────────────────────────────────────────────
export async function deleteHarvestOrder(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .update(harvestOrders)
    .set({ deletedAt: new Date() })
    .where(and(eq(harvestOrders.id, id), eq(harvestOrders.userId, session.user.id)))

  revalidatePath('/dashboard/harvest-orders')
}

// ── Add a customer order line ───────────────────────────────────────────────
export async function addOrderItem(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = harvestOrderItemSchema.parse(data)
  const qty = validated.quantityKg
  const price = validated.pricePerUnit ?? 0
  const total = qty * price

  const [item] = await db
    .insert(harvestOrderItems)
    .values({
      orderId: validated.orderId,
      userId: session.user.id,
      customerId: validated.customerId ?? null,
      customerName: validated.customerName,
      productName: validated.productName,
      quantityKg: qty.toString(),
      unit: validated.unit,
      pricePerUnit: price > 0 ? price.toString() : null,
      totalPrice: total > 0 ? total.toString() : null,
      notes: validated.notes,
    })
    .returning()

  revalidatePath(`/dashboard/harvest-orders/${validated.orderId}`)
  return item
}

// ── Update an order line ────────────────────────────────────────────────────
export async function updateOrderItem(itemId: string, data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = harvestOrderItemSchema.parse(data)
  const qty = validated.quantityKg
  const price = validated.pricePerUnit ?? 0
  const total = qty * price

  await db
    .update(harvestOrderItems)
    .set({
      customerName: validated.customerName,
      customerId: validated.customerId ?? null,
      productName: validated.productName,
      quantityKg: qty.toString(),
      unit: validated.unit,
      pricePerUnit: price > 0 ? price.toString() : null,
      totalPrice: total > 0 ? total.toString() : null,
      notes: validated.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(harvestOrderItems.id, itemId), eq(harvestOrderItems.userId, session.user.id)))

  revalidatePath(`/dashboard/harvest-orders/${validated.orderId}`)
}

// ── Delete an order line ────────────────────────────────────────────────────
export async function deleteOrderItem(itemId: string, orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .delete(harvestOrderItems)
    .where(and(eq(harvestOrderItems.id, itemId), eq(harvestOrderItems.userId, session.user.id)))

  revalidatePath(`/dashboard/harvest-orders/${orderId}`)
}

// ── Get order detail with pivot tables ─────────────────────────────────────
export async function getHarvestOrderSummary(orderId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const order = await db.query.harvestOrders.findFirst({
    where: and(eq(harvestOrders.id, orderId), eq(harvestOrders.userId, session.user.id)),
    with: { items: true },
  })
  if (!order) throw new Error('Order not found')

  const items = order.items

  // Totals per product
  const productTotals: Record<string, { quantity: number; unit: string; revenue: number }> = {}
  for (const item of items) {
    const key = `${item.productName}|||${item.unit}`
    const qty = parseFloat(item.quantityKg)
    const rev = parseFloat(item.totalPrice ?? '0')
    if (!productTotals[key]) {
      productTotals[key] = { quantity: 0, unit: item.unit, revenue: 0 }
    }
    productTotals[key]!.quantity += qty
    productTotals[key]!.revenue += rev
  }

  // Per customer breakdown
  const customerMap: Record<
    string,
    {
      customerName: string
      items: typeof items
      orderTotal: number
    }
  > = {}
  for (const item of items) {
    if (!customerMap[item.customerName]) {
      customerMap[item.customerName] = { customerName: item.customerName, items: [], orderTotal: 0 }
    }
    customerMap[item.customerName]!.items.push(item)
    customerMap[item.customerName]!.orderTotal += parseFloat(item.totalPrice ?? '0')
  }

  // All unique product names
  const allProducts = [...new Set(items.map((i) => i.productName))]

  return {
    order,
    items,
    productTotals: Object.entries(productTotals).map(([key, v]) => ({
      productName: key.split('|||')[0]!,
      unit: v.unit,
      quantity: v.quantity,
      revenue: v.revenue,
    })),
    customerBreakdown: Object.values(customerMap),
    allProducts,
    grandTotal: items.reduce((s, i) => s + parseFloat(i.totalPrice ?? '0'), 0),
  }
}

// ── Get customers list for dropdown ────────────────────────────────────────
export async function getCustomersForOrders() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.customers.findMany({
    where: and(eq(customers.userId, session.user.id), sql`${customers.deletedAt} IS NULL`),
    orderBy: [customers.name],
    columns: { id: true, name: true, phone: true },
  })
}

// ── Get active plantings and trees as product options ──────────────────────
export async function getActiveProducts() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [activePlantings, activeTrees] = await Promise.all([
    // Active planting logs joined with crop name
    db.query.plantingLogs.findMany({
      where: and(
        eq(plantingLogs.userId, session.user.id),
        eq(plantingLogs.status, 'active'),
        sql`${plantingLogs.deletedAt} IS NULL`
      ),
      with: { crop: { columns: { name: true, variety: true } } },
      columns: { id: true, plantingDate: true },
    }),
    // Healthy/active trees
    db.query.trees.findMany({
      where: and(
        eq(trees.userId, session.user.id),
        sql`${trees.deletedAt} IS NULL`,
        sql`${trees.status} NOT IN ('dead', 'removed')`
      ),
      columns: { id: true, identifier: true, species: true, variety: true },
      orderBy: [trees.species, trees.identifier],
    }),
  ])

  const plantingOptions = activePlantings
    .map((p) => ({
      id: p.id,
      label: p.crop.variety ? `${p.crop.name} (${p.crop.variety})` : p.crop.name,
      productName: p.crop.variety ? `${p.crop.name} (${p.crop.variety})` : p.crop.name,
    }))
    // Deduplicate by label (same crop can have multiple planting batches)
    .filter((v, i, arr) => arr.findIndex((x) => x.label === v.label) === i)
    .sort((a, b) => a.label.localeCompare(b.label))

  const treeOptions = activeTrees.map((t) => ({
    id: t.id,
    label: t.variety
      ? `${t.species} - ${t.identifier} (${t.variety})`
      : `${t.species} - ${t.identifier}`,
    productName: t.variety ? `${t.species} (${t.variety})` : t.species,
  }))

  return { plantingOptions, treeOptions }
}

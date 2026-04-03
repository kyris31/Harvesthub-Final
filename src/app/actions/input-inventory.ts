'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { inputInventory } from '@/lib/db/schema'
import { and, eq, isNull, desc, or, ilike, sql, gt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { inputInventorySchema, type InputInventoryFormData } from '@/lib/validations/inventory'

export async function getInputInventory(search?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [
    eq(inputInventory.userId, session.user.id),
    isNull(inputInventory.deletedAt),
    // Only show items with quantity > 0
    sql`CAST(${inputInventory.currentQuantity} AS DECIMAL) > 0`,
  ]

  if (search) {
    whereConditions.push(
      or(ilike(inputInventory.name, `%${search}%`), ilike(inputInventory.type, `%${search}%`))!
    )
  }

  return await db.query.inputInventory.findMany({
    where: and(...whereConditions),
    orderBy: [desc(inputInventory.createdAt)],
    with: {
      supplier: true,
    },
  })
}

export async function getInputItem(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const item = await db.query.inputInventory.findFirst({
    where: and(
      eq(inputInventory.id, id),
      eq(inputInventory.userId, session.user.id),
      isNull(inputInventory.deletedAt)
    ),
    with: {
      supplier: true,
    },
  })

  if (!item) {
    throw new Error('Input item not found')
  }

  return item
}

export async function createInputItem(data: InputInventoryFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = inputInventorySchema.parse(data)

  const [item] = await db
    .insert(inputInventory)
    .values({
      ...validated,
      supplierId: validated.supplierId || null,
      purchaseDate: validated.purchaseDate || null,
      initialQuantity: validated.initialQuantity || null,
      costPerUnit: validated.costPerUnit || null,
      totalCost: validated.totalCost || null,
      minimumStockLevel: validated.minimumStockLevel || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/inventory/inputs')
  return item
}

export async function updateInputItem(id: string, data: InputInventoryFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = inputInventorySchema.parse(data)

  // Verify ownership
  const existing = await db.query.inputInventory.findFirst({
    where: and(
      eq(inputInventory.id, id),
      eq(inputInventory.userId, session.user.id),
      isNull(inputInventory.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Input item not found')
  }

  const [updated] = await db
    .update(inputInventory)
    .set({
      ...validated,
      supplierId: validated.supplierId || null,
      purchaseDate: validated.purchaseDate || null,
      initialQuantity: validated.initialQuantity || null,
      costPerUnit: validated.costPerUnit || null,
      totalCost: validated.totalCost || null,
      minimumStockLevel: validated.minimumStockLevel || null,
      updatedAt: new Date(),
    })
    .where(eq(inputInventory.id, id))
    .returning()

  revalidatePath('/dashboard/inventory/inputs')
  revalidatePath(`/dashboard/inventory/inputs/${id}`)
  return updated
}

export async function deleteInputItem(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.inputInventory.findFirst({
    where: and(
      eq(inputInventory.id, id),
      eq(inputInventory.userId, session.user.id),
      isNull(inputInventory.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Input item not found')
  }

  // Soft delete
  await db.update(inputInventory).set({ deletedAt: new Date() }).where(eq(inputInventory.id, id))

  revalidatePath('/dashboard/inventory/inputs')
}

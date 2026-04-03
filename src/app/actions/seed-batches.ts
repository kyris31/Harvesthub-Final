'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { seedBatches, crops } from '@/lib/db/schema'
import { and, eq, isNull, desc, or, ilike, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { seedBatchSchema, type SeedBatchFormData } from '@/lib/validations/inventory'

export async function getSeedBatches(options?: {
  search?: string
  sortBy?: string
  sortOrder?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const { search, sortBy = 'cropName', sortOrder = 'asc' } = options ?? {}

  const whereConditions = [
    eq(seedBatches.userId, session.user.id),
    isNull(seedBatches.deletedAt),
    sql`${seedBatches.currentQuantity} > 0`, // Hide empty batches
  ]

  if (search) {
    whereConditions.push(or(ilike(seedBatches.batchCode, `%${search}%`))!)
  }

  const results = await db.query.seedBatches.findMany({
    where: and(...whereConditions),
    orderBy: [desc(seedBatches.createdAt)],
    with: {
      crop: true,
      supplier: true,
    },
  })

  // Sort in JS (supports joined crop name)
  return results.sort((a, b) => {
    let valA: string
    let valB: string
    if (sortBy === 'batchCode') {
      valA = a.batchCode
      valB = b.batchCode
    } else if (sortBy === 'createdAt') {
      valA = a.createdAt.toISOString()
      valB = b.createdAt.toISOString()
    } else {
      // cropName (default)
      valA = a.crop.name + (a.crop.variety ?? '')
      valB = b.crop.name + (b.crop.variety ?? '')
    }
    const cmp = valA.localeCompare(valB)
    return sortOrder === 'desc' ? -cmp : cmp
  })
}

export async function getSeedBatch(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const batch = await db.query.seedBatches.findFirst({
    where: and(
      eq(seedBatches.id, id),
      eq(seedBatches.userId, session.user.id),
      isNull(seedBatches.deletedAt)
    ),
    with: {
      crop: true,
      supplier: true,
    },
  })

  if (!batch) {
    throw new Error('Seed batch not found')
  }

  return batch
}

export async function createSeedBatch(data: SeedBatchFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = seedBatchSchema.parse(data)

  // Get crop info for batch code generation
  const crop = await db.query.crops.findFirst({
    where: eq(crops.id, validated.cropId),
  })

  if (!crop) {
    throw new Error('Crop not found')
  }

  // Auto-generate batch code: CROP-YYYY-MM-NNN
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const cropPrefix = crop.name.substring(0, 3).toUpperCase()

  // Find the next sequence number for this crop/month
  const existingBatches = await db.query.seedBatches.findMany({
    where: and(
      eq(seedBatches.userId, session.user.id),
      eq(seedBatches.cropId, validated.cropId),
      isNull(seedBatches.deletedAt)
    ),
    orderBy: [desc(seedBatches.createdAt)],
  })

  // Get the highest sequence number for this crop/month/year
  const pattern = `${cropPrefix}-${year}-${month}-`
  const maxSequence = existingBatches
    .map((b) => b.batchCode)
    .filter((code) => code.startsWith(pattern))
    .map((code) => parseInt(code.split('-')[3]) || 0)
    .reduce((max, num) => Math.max(max, num), 0)

  const sequence = String(maxSequence + 1).padStart(3, '0')
  const batchCode = `${cropPrefix}-${year}-${month}-${sequence}`

  const [batch] = await db
    .insert(seedBatches)
    .values({
      ...validated,
      batchCode, // Use auto-generated code
      supplierId:
        validated.supplierId === 'self-produced' || !validated.supplierId
          ? null
          : validated.supplierId,
      purchaseDate: validated.purchaseDate || null,
      costPerUnit: validated.costPerUnit || null,
      totalCost: validated.totalCost || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/inventory/seeds')
  return batch
}

export async function updateSeedBatch(id: string, data: SeedBatchFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = seedBatchSchema.parse(data)

  // Verify ownership
  const existing = await db.query.seedBatches.findFirst({
    where: and(
      eq(seedBatches.id, id),
      eq(seedBatches.userId, session.user.id),
      isNull(seedBatches.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Seed batch not found')
  }

  // Check if batch code is taken by another batch
  const duplicate = await db.query.seedBatches.findFirst({
    where: and(
      eq(seedBatches.batchCode, validated.batchCode),
      eq(seedBatches.userId, session.user.id),
      isNull(seedBatches.deletedAt)
    ),
  })

  if (duplicate && duplicate.id !== id) {
    throw new Error('Batch code already exists')
  }

  const [updated] = await db
    .update(seedBatches)
    .set({
      ...validated,
      supplierId: validated.supplierId || null,
      purchaseDate: validated.purchaseDate || null,
      costPerUnit: validated.costPerUnit || null,
      totalCost: validated.totalCost || null,
      updatedAt: new Date(),
    })
    .where(eq(seedBatches.id, id))
    .returning()

  revalidatePath('/dashboard/inventory/seeds')
  revalidatePath(`/dashboard/inventory/seeds/${id}`)
  return updated
}

export async function deleteSeedBatch(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.seedBatches.findFirst({
    where: and(
      eq(seedBatches.id, id),
      eq(seedBatches.userId, session.user.id),
      isNull(seedBatches.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Seed batch not found')
  }

  // Soft delete
  await db.update(seedBatches).set({ deletedAt: new Date() }).where(eq(seedBatches.id, id))

  revalidatePath('/dashboard/inventory/seeds')
}

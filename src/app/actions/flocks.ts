'use server'

import { db } from '@/lib/db'
import { flocks, eggProduction, mortalityRecords } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { flockSchema } from '@/lib/validations/poultry'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get all flocks
export async function getFlocks() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const result = await db
    .select()
    .from(flocks)
    .where(and(eq(flocks.userId, session.user.id), sql`${flocks.deletedAt} IS NULL`))
    .orderBy(desc(flocks.createdAt))

  return result
}

// Get flock by ID with stats
export async function getFlockById(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const flock = await db.query.flocks.findFirst({
    where: and(
      eq(flocks.id, id),
      eq(flocks.userId, session.user.id),
      sql`${flocks.deletedAt} IS NULL`
    ),
  })

  if (!flock) {
    throw new Error('Flock not found')
  }

  return flock
}

// Get flock statistics
export async function getFlockStats(id: string, startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Verify flock ownership
  const flock = await getFlockById(id)

  // Get egg production stats
  const eggStats = await db
    .select({
      totalEggs: sql<number>`COALESCE(SUM(${eggProduction.eggsCollected}), 0)`,
      totalCracked: sql<number>`COALESCE(SUM(${eggProduction.eggsCracked}), 0)`,
      avgDaily: sql<number>`COALESCE(AVG(${eggProduction.eggsCollected}), 0)`,
    })
    .from(eggProduction)
    .where(
      and(
        eq(eggProduction.flockId, id),
        eq(eggProduction.userId, session.user.id),
        startDate ? gte(eggProduction.collectionDate, startDate) : undefined,
        endDate ? lte(eggProduction.collectionDate, endDate) : undefined
      )
    )

  // Get mortality stats
  const mortalityStats = await db
    .select({
      totalDeaths: sql<number>`COALESCE(SUM(${mortalityRecords.count}), 0)`,
    })
    .from(mortalityRecords)
    .where(
      and(
        eq(mortalityRecords.flockId, id),
        eq(mortalityRecords.userId, session.user.id),
        startDate ? gte(mortalityRecords.recordDate, startDate) : undefined,
        endDate ? lte(mortalityRecords.recordDate, endDate) : undefined
      )
    )

  // Calculate mortality rate
  const mortalityRate =
    flock.initialCount > 0 ? ((mortalityStats[0]?.totalDeaths || 0) / flock.initialCount) * 100 : 0

  // Calculate production rate (eggs per bird per day)
  const productionRate =
    flock.currentCount > 0 && eggStats[0]?.avgDaily
      ? (eggStats[0].avgDaily / flock.currentCount) * 100
      : 0

  return {
    flock,
    eggProduction: {
      total: eggStats[0]?.totalEggs || 0,
      cracked: eggStats[0]?.totalCracked || 0,
      avgDaily: eggStats[0]?.avgDaily || 0,
      productionRate: Math.round(productionRate * 10) / 10,
    },
    mortality: {
      total: mortalityStats[0]?.totalDeaths || 0,
      rate: Math.round(mortalityRate * 10) / 10,
    },
  }
}

// Create flock
export async function createFlock(data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = flockSchema.parse(data)

  const [newFlock] = await db
    .insert(flocks)
    .values({
      ...validatedData,
      userId: session.user.id,
      supplierId: validatedData.supplierId || null,
      costPerBird: validatedData.costPerBird?.toString(),
      totalCost: validatedData.totalCost?.toString(),
    })
    .returning()

  revalidatePath('/dashboard/poultry/flocks')
  return newFlock
}

// Update flock
export async function updateFlock(id: string, data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = flockSchema.parse(data)

  const [updatedFlock] = await db
    .update(flocks)
    .set({
      ...validatedData,
      supplierId: validatedData.supplierId || null,
      costPerBird: validatedData.costPerBird?.toString(),
      totalCost: validatedData.totalCost?.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(flocks.id, id), eq(flocks.userId, session.user.id), sql`${flocks.deletedAt} IS NULL`)
    )
    .returning()

  if (!updatedFlock) {
    throw new Error('Flock not found')
  }

  revalidatePath('/dashboard/poultry/flocks')
  revalidatePath(`/dashboard/poultry/flocks/${id}`)
  return updatedFlock
}

// Delete flock (soft delete)
export async function deleteFlock(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await db
    .update(flocks)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(flocks.id, id), eq(flocks.userId, session.user.id)))

  revalidatePath('/dashboard/poultry/flocks')
}

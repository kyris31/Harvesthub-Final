'use server'

import { db } from '@/lib/db'
import { eggProduction, flocks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { eggProductionSchema } from '@/lib/validations/poultry'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get egg production records
export async function getEggProduction(flockId?: string, startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const records = await db.query.eggProduction.findMany({
    where: and(
      eq(eggProduction.userId, session.user.id),
      flockId ? eq(eggProduction.flockId, flockId) : undefined,
      startDate ? gte(eggProduction.collectionDate, startDate) : undefined,
      endDate ? lte(eggProduction.collectionDate, endDate) : undefined
    ),
    with: {
      flock: true,
    },
    orderBy: [desc(eggProduction.collectionDate)],
  })

  return records
}

// Get egg production stats
export async function getEggProductionStats(
  flockId?: string,
  startDate?: string,
  endDate?: string
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const stats = await db
    .select({
      totalEggs: sql<number>`COALESCE(SUM(${eggProduction.eggsCollected}), 0)`,
      totalCracked: sql<number>`COALESCE(SUM(${eggProduction.eggsCracked}), 0)`,
      totalSmall: sql<number>`COALESCE(SUM(${eggProduction.eggsSmall}), 0)`,
      totalMedium: sql<number>`COALESCE(SUM(${eggProduction.eggsMedium}), 0)`,
      totalLarge: sql<number>`COALESCE(SUM(${eggProduction.eggsLarge}), 0)`,
      totalXLarge: sql<number>`COALESCE(SUM(${eggProduction.eggsXLarge}), 0)`,
      avgDaily: sql<number>`COALESCE(AVG(${eggProduction.eggsCollected}), 0)`,
      recordCount: sql<number>`COUNT(*)`,
    })
    .from(eggProduction)
    .where(
      and(
        eq(eggProduction.userId, session.user.id),
        flockId ? eq(eggProduction.flockId, flockId) : undefined,
        startDate ? gte(eggProduction.collectionDate, startDate) : undefined,
        endDate ? lte(eggProduction.collectionDate, endDate) : undefined
      )
    )

  return (
    stats[0] || {
      totalEggs: 0,
      totalCracked: 0,
      totalSmall: 0,
      totalMedium: 0,
      totalLarge: 0,
      totalXLarge: 0,
      avgDaily: 0,
      recordCount: 0,
    }
  )
}

// Create egg production record
export async function createEggProduction(data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = eggProductionSchema.parse(data)

  // Verify flock ownership
  const flock = await db.query.flocks.findFirst({
    where: and(
      eq(flocks.id, validatedData.flockId),
      eq(flocks.userId, session.user.id),
      sql`${flocks.deletedAt} IS NULL`
    ),
  })

  if (!flock) {
    throw new Error('Flock not found')
  }

  const [newRecord] = await db
    .insert(eggProduction)
    .values({
      ...validatedData,
      userId: session.user.id,
      currentStock: validatedData.eggsCollected - (validatedData.eggsCracked ?? 0),
    })
    .returning()

  revalidatePath('/dashboard/poultry/records/eggs')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  return newRecord
}

// Update egg production record
export async function updateEggProduction(id: string, data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = eggProductionSchema.parse(data)

  const [updatedRecord] = await db
    .update(eggProduction)
    .set({
      ...validatedData,
      updatedAt: new Date(),
    })
    .where(and(eq(eggProduction.id, id), eq(eggProduction.userId, session.user.id)))
    .returning()

  if (!updatedRecord) {
    throw new Error('Record not found')
  }

  revalidatePath('/dashboard/poultry/records/eggs')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  return updatedRecord
}

// Delete egg production record
export async function deleteEggProduction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await db
    .delete(eggProduction)
    .where(and(eq(eggProduction.id, id), eq(eggProduction.userId, session.user.id)))

  revalidatePath('/dashboard/poultry/records/eggs')
}

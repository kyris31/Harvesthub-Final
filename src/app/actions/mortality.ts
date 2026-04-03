'use server'

import { db } from '@/lib/db'
import { mortalityRecords, flocks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { mortalityRecordSchema } from '@/lib/validations/poultry'
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get mortality records
export async function getMortalityRecords(flockId?: string, startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const records = await db.query.mortalityRecords.findMany({
    where: and(
      eq(mortalityRecords.userId, session.user.id),
      flockId ? eq(mortalityRecords.flockId, flockId) : undefined,
      startDate ? gte(mortalityRecords.recordDate, startDate) : undefined,
      endDate ? lte(mortalityRecords.recordDate, endDate) : undefined
    ),
    with: {
      flock: true,
    },
    orderBy: [desc(mortalityRecords.recordDate)],
  })

  return records
}

// Get mortality stats
export async function getMortalityStats(flockId?: string, startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const stats = await db
    .select({
      totalDeaths: sql<number>`COALESCE(SUM(${mortalityRecords.count}), 0)`,
      recordCount: sql<number>`COUNT(*)`,
      byCause: sql<any>`json_agg(json_build_object('cause', ${mortalityRecords.cause}, 'count', ${mortalityRecords.count}))`,
    })
    .from(mortalityRecords)
    .where(
      and(
        eq(mortalityRecords.userId, session.user.id),
        flockId ? eq(mortalityRecords.flockId, flockId) : undefined,
        startDate ? gte(mortalityRecords.recordDate, startDate) : undefined,
        endDate ? lte(mortalityRecords.recordDate, endDate) : undefined
      )
    )

  return (
    stats[0] || {
      totalDeaths: 0,
      recordCount: 0,
      byCause: [],
    }
  )
}

// Create mortality record
export async function createMortalityRecord(data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = mortalityRecordSchema.parse(data)

  // Verify flock ownership and get current count
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

  // Create mortality record
  const [newRecord] = await db
    .insert(mortalityRecords)
    .values({
      ...validatedData,
      userId: session.user.id,
    })
    .returning()

  // Update flock count
  const newCount = Math.max(0, flock.currentCount - validatedData.count)
  await db
    .update(flocks)
    .set({
      currentCount: newCount,
      updatedAt: new Date(),
    })
    .where(eq(flocks.id, validatedData.flockId))

  revalidatePath('/dashboard/poultry/records/mortality')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  revalidatePath('/dashboard/poultry/flocks')
  return newRecord
}

// Update mortality record
export async function updateMortalityRecord(id: string, data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = mortalityRecordSchema.parse(data)

  // Get the old record to adjust flock count
  const oldRecord = await db.query.mortalityRecords.findFirst({
    where: and(eq(mortalityRecords.id, id), eq(mortalityRecords.userId, session.user.id)),
  })

  if (!oldRecord) {
    throw new Error('Record not found')
  }

  // Update the record
  const [updatedRecord] = await db
    .update(mortalityRecords)
    .set({
      ...validatedData,
      updatedAt: new Date(),
    })
    .where(and(eq(mortalityRecords.id, id), eq(mortalityRecords.userId, session.user.id)))
    .returning()

  // Adjust flock count if count changed
  if (oldRecord.count !== validatedData.count) {
    const flock = await db.query.flocks.findFirst({
      where: eq(flocks.id, validatedData.flockId),
    })

    if (flock) {
      const countDiff = validatedData.count - oldRecord.count
      const newCount = Math.max(0, flock.currentCount - countDiff)
      await db
        .update(flocks)
        .set({
          currentCount: newCount,
          updatedAt: new Date(),
        })
        .where(eq(flocks.id, validatedData.flockId))
    }
  }

  revalidatePath('/dashboard/poultry/records/mortality')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  revalidatePath('/dashboard/poultry/flocks')
  return updatedRecord
}

// Delete mortality record
export async function deleteMortalityRecord(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  // Get the record to restore flock count
  const record = await db.query.mortalityRecords.findFirst({
    where: and(eq(mortalityRecords.id, id), eq(mortalityRecords.userId, session.user.id)),
  })

  if (record) {
    // Restore birds to flock count
    await db
      .update(flocks)
      .set({
        currentCount: sql`${flocks.currentCount} + ${record.count}`,
        updatedAt: new Date(),
      })
      .where(eq(flocks.id, record.flockId))
  }

  await db
    .delete(mortalityRecords)
    .where(and(eq(mortalityRecords.id, id), eq(mortalityRecords.userId, session.user.id)))

  revalidatePath('/dashboard/poultry/records/mortality')
  revalidatePath('/dashboard/poultry/flocks')
}

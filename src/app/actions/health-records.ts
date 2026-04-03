'use server'

import { db } from '@/lib/db'
import { healthRecords, flocks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { healthRecordSchema } from '@/lib/validations/poultry'
import { eq, and, desc, sql, gte, lte, isNotNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get health records
export async function getHealthRecords(flockId?: string, startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const records = await db.query.healthRecords.findMany({
    where: and(
      eq(healthRecords.userId, session.user.id),
      flockId ? eq(healthRecords.flockId, flockId) : undefined,
      startDate ? gte(healthRecords.recordDate, startDate) : undefined,
      endDate ? lte(healthRecords.recordDate, endDate) : undefined
    ),
    with: {
      flock: true,
    },
    orderBy: [desc(healthRecords.recordDate)],
  })

  return records
}

// Get upcoming vaccinations/treatments
export async function getUpcomingVaccinations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30) // Next 30 days
  const future = futureDate.toISOString().split('T')[0]

  const upcoming = await db.query.healthRecords.findMany({
    where: and(
      eq(healthRecords.userId, session.user.id),
      isNotNull(healthRecords.nextDueDate),
      sql`${healthRecords.nextDueDate} >= ${today}`,
      sql`${healthRecords.nextDueDate} <= ${future}`
    ),
    with: {
      flock: true,
    },
    orderBy: [healthRecords.nextDueDate],
  })

  return upcoming
}

// Create health record
export async function createHealthRecord(data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = healthRecordSchema.parse(data)

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
    .insert(healthRecords)
    .values({
      ...validatedData,
      userId: session.user.id,
      cost: validatedData.cost?.toString(),
    })
    .returning()

  revalidatePath('/dashboard/poultry/records/health')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  return newRecord
}

// Update health record
export async function updateHealthRecord(id: string, data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = healthRecordSchema.parse(data)

  const [updatedRecord] = await db
    .update(healthRecords)
    .set({
      ...validatedData,
      cost: validatedData.cost?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(healthRecords.id, id), eq(healthRecords.userId, session.user.id)))
    .returning()

  if (!updatedRecord) {
    throw new Error('Record not found')
  }

  revalidatePath('/dashboard/poultry/records/health')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  return updatedRecord
}

// Delete health record
export async function deleteHealthRecord(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await db
    .delete(healthRecords)
    .where(and(eq(healthRecords.id, id), eq(healthRecords.userId, session.user.id)))

  revalidatePath('/dashboard/poultry/records/health')
}

'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { harvestLogs } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { harvestLogSchema, type HarvestLogFormData } from '@/lib/validations/harvest'

export async function getHarvestLogs(filters?: {
  plantingLogId?: string
  startDate?: string
  endDate?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [eq(harvestLogs.userId, session.user.id), isNull(harvestLogs.deletedAt)]

  if (filters?.plantingLogId) {
    whereConditions.push(eq(harvestLogs.plantingLogId, filters.plantingLogId))
  }

  if (filters?.startDate) {
    whereConditions.push(gte(harvestLogs.harvestDate, filters.startDate))
  }

  if (filters?.endDate) {
    whereConditions.push(lte(harvestLogs.harvestDate, filters.endDate))
  }

  return await db.query.harvestLogs.findMany({
    where: and(...whereConditions),
    orderBy: [desc(harvestLogs.harvestDate)],
    with: {
      plantingLog: {
        with: {
          crop: true,
          plot: true,
        },
      },
    },
  })
}

export async function getHarvestLog(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const harvest = await db.query.harvestLogs.findFirst({
    where: and(
      eq(harvestLogs.id, id),
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt)
    ),
    with: {
      plantingLog: {
        with: {
          crop: true,
          plot: true,
        },
      },
    },
  })

  if (!harvest) {
    throw new Error('Harvest not found')
  }

  return harvest
}

export async function createHarvestLog(data: HarvestLogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = harvestLogSchema.parse(data)

  const [harvest] = await db
    .insert(harvestLogs)
    .values({
      ...validated,
      qualityGrade: validated.qualityGrade || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/planting')
  return harvest
}

export async function updateHarvestLog(id: string, data: HarvestLogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = harvestLogSchema.parse(data)

  // Verify ownership
  const existing = await db.query.harvestLogs.findFirst({
    where: and(
      eq(harvestLogs.id, id),
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Harvest not found')
  }

  const [updated] = await db
    .update(harvestLogs)
    .set({
      ...validated,
      qualityGrade: validated.qualityGrade || null,
      updatedAt: new Date(),
    })
    .where(eq(harvestLogs.id, id))
    .returning()

  revalidatePath('/dashboard/harvests')
  revalidatePath(`/dashboard/harvests/${id}`)
  revalidatePath('/dashboard/planting')
  return updated
}

export async function deleteHarvestLog(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.harvestLogs.findFirst({
    where: and(
      eq(harvestLogs.id, id),
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Harvest not found')
  }

  // Soft delete
  await db.update(harvestLogs).set({ deletedAt: new Date() }).where(eq(harvestLogs.id, id))

  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/planting')
}

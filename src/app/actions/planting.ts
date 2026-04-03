'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { plantingLogs, harvestLogs } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { plantingLogSchema, type PlantingLogFormData } from '@/lib/validations/planting'

export async function getPlantingLogs(filters?: {
  cropId?: string
  plotId?: string
  status?: string
  startDate?: string
  endDate?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [eq(plantingLogs.userId, session.user.id), isNull(plantingLogs.deletedAt)]

  if (filters?.cropId) {
    whereConditions.push(eq(plantingLogs.cropId, filters.cropId))
  }

  if (filters?.plotId) {
    whereConditions.push(eq(plantingLogs.plotId, filters.plotId))
  }

  if (filters?.status) {
    whereConditions.push(eq(plantingLogs.status, filters.status))
  }

  if (filters?.startDate) {
    whereConditions.push(gte(plantingLogs.plantingDate, filters.startDate))
  }

  if (filters?.endDate) {
    whereConditions.push(lte(plantingLogs.plantingDate, filters.endDate))
  }

  return await db.query.plantingLogs.findMany({
    where: and(...whereConditions),
    orderBy: [desc(plantingLogs.plantingDate)],
    with: {
      crop: true,
      plot: true,
    },
  })
}

export async function getPlantingLog(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const planting = await db.query.plantingLogs.findFirst({
    where: and(
      eq(plantingLogs.id, id),
      eq(plantingLogs.userId, session.user.id),
      isNull(plantingLogs.deletedAt)
    ),
    with: {
      crop: true,
      plot: true,
      harvestLogs: {
        where: isNull(harvestLogs.deletedAt),
      },
    },
  })

  if (!planting) {
    throw new Error('Planting not found')
  }

  return planting
}

export async function createPlantingLog(data: PlantingLogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = plantingLogSchema.parse(data)

  const [planting] = await db
    .insert(plantingLogs)
    .values({
      ...validated,
      plotId: validated.plotId || null,
      seedBatchId: validated.seedBatchId || null,
      selfProducedSeedlingId: validated.selfProducedSeedlingId || null,
      purchasedSeedlingId: validated.purchasedSeedlingId || null,
      expectedHarvestDate: validated.expectedHarvestDate || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/planting')
  return planting
}

export async function updatePlantingLog(id: string, data: PlantingLogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = plantingLogSchema.parse(data)

  // Verify ownership
  const existing = await db.query.plantingLogs.findFirst({
    where: and(
      eq(plantingLogs.id, id),
      eq(plantingLogs.userId, session.user.id),
      isNull(plantingLogs.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Planting not found')
  }

  const [updated] = await db
    .update(plantingLogs)
    .set({
      ...validated,
      plotId: validated.plotId || null,
      seedBatchId: validated.seedBatchId || null,
      selfProducedSeedlingId: validated.selfProducedSeedlingId || null,
      purchasedSeedlingId: validated.purchasedSeedlingId || null,
      expectedHarvestDate: validated.expectedHarvestDate || null,
      updatedAt: new Date(),
    })
    .where(eq(plantingLogs.id, id))
    .returning()

  revalidatePath('/dashboard/planting')
  revalidatePath(`/dashboard/planting/${id}`)
  return updated
}

export async function deletePlantingLog(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.plantingLogs.findFirst({
    where: and(
      eq(plantingLogs.id, id),
      eq(plantingLogs.userId, session.user.id),
      isNull(plantingLogs.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Planting not found')
  }

  // Check for dependencies (harvests)
  const hasHarvests = await db.query.harvestLogs.findFirst({
    where: and(eq(harvestLogs.plantingLogId, id), isNull(harvestLogs.deletedAt)),
  })

  if (hasHarvests) {
    throw new Error('Cannot delete planting with harvest records. Please delete harvests first.')
  }

  // Soft delete
  await db.update(plantingLogs).set({ deletedAt: new Date() }).where(eq(plantingLogs.id, id))

  revalidatePath('/dashboard/planting')
}

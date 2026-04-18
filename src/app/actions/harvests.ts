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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

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

  const rows = await db.query.harvestLogs.findMany({
    where: and(...whereConditions),
    orderBy: [desc(harvestLogs.harvestDate)],
    with: {
      plantingLog: { with: { crop: true, plot: true } },
      tree: true,
      saleItems: true,
    },
  })

  return rows.map((h) => {
    const totalSold = h.saleItems.reduce((sum, si) => sum + parseFloat(si.quantity), 0)
    const computed = Math.max(0, parseFloat(h.quantityHarvested) - totalSold)
    return { ...h, currentStock: computed.toFixed(2) }
  })
}

export async function getHarvestLog(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const harvest = await db.query.harvestLogs.findFirst({
    where: and(
      eq(harvestLogs.id, id),
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt)
    ),
    with: {
      plantingLog: { with: { crop: true, plot: true } },
      tree: true,
      saleItems: true,
    },
  })

  if (!harvest) throw new Error('Harvest not found')

  const totalSold = harvest.saleItems.reduce((sum, si) => sum + parseFloat(si.quantity), 0)
  const computed = Math.max(0, parseFloat(harvest.quantityHarvested) - totalSold)
  return { ...harvest, currentStock: computed.toFixed(2) }
}

export async function createHarvestLog(data: HarvestLogFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = harvestLogSchema.parse(data)

  const [harvest] = await db
    .insert(harvestLogs)
    .values({
      userId: session.user.id,
      plantingLogId: validated.sourceType === 'planting' ? validated.plantingLogId || null : null,
      treeId: validated.sourceType === 'tree' ? validated.treeId || null : null,
      harvestDate: validated.harvestDate,
      quantityHarvested: validated.quantityHarvested,
      quantityUnit: validated.quantityUnit,
      currentStock: validated.quantityHarvested,
      qualityGrade: validated.qualityGrade || null,
      notes: validated.notes || null,
    })
    .returning()

  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/harvest')
  revalidatePath('/dashboard/planting')
  return harvest
}

export async function updateHarvestLog(id: string, data: HarvestLogFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = harvestLogSchema.parse(data)

  const existing = await db.query.harvestLogs.findFirst({
    where: and(
      eq(harvestLogs.id, id),
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt)
    ),
  })
  if (!existing) throw new Error('Harvest not found')

  const [updated] = await db
    .update(harvestLogs)
    .set({
      plantingLogId: validated.sourceType === 'planting' ? validated.plantingLogId || null : null,
      treeId: validated.sourceType === 'tree' ? validated.treeId || null : null,
      harvestDate: validated.harvestDate,
      quantityHarvested: validated.quantityHarvested,
      quantityUnit: validated.quantityUnit,
      currentStock: validated.quantityHarvested,
      qualityGrade: validated.qualityGrade || null,
      notes: validated.notes || null,
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.harvestLogs.findFirst({
    where: and(
      eq(harvestLogs.id, id),
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt)
    ),
  })
  if (!existing) throw new Error('Harvest not found')

  await db.update(harvestLogs).set({ deletedAt: new Date() }).where(eq(harvestLogs.id, id))

  revalidatePath('/dashboard/harvests')
  revalidatePath('/dashboard/harvest')
  revalidatePath('/dashboard/planting')
}

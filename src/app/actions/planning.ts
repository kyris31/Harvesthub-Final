'use server'

import { db } from '@/lib/db'
import { cropSeasons, cropPlans } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { seasonSchema, cropPlanSchema } from '@/lib/validations/planning'
import { eq, and, desc, asc, sql, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const revalidate = () => {
  revalidatePath('/dashboard/planning')
  revalidatePath('/dashboard/planning/seasons')
  revalidatePath('/dashboard/planning/calendar')
}

// ─── SEASONS ─────────────────────────────────────────────────────────────────

export async function getSeasons() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.cropSeasons.findMany({
    where: and(eq(cropSeasons.userId, session.user.id), isNull(cropSeasons.deletedAt)),
    with: { cropPlans: true },
    orderBy: [desc(cropSeasons.startDate)],
  })
}

export async function getSeasonById(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.cropSeasons.findFirst({
    where: and(
      eq(cropSeasons.id, id),
      eq(cropSeasons.userId, session.user.id),
      isNull(cropSeasons.deletedAt)
    ),
    with: { cropPlans: { with: { crop: true, plot: true } } },
  })
}

export async function createSeason(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = seasonSchema.parse(data)
  const [season] = await db
    .insert(cropSeasons)
    .values({
      ...validated,
      userId: session.user.id,
    })
    .returning()

  revalidate()
  return season
}

export async function updateSeason(id: string, data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = seasonSchema.parse(data)
  const [season] = await db
    .update(cropSeasons)
    .set({ ...validated, updatedAt: new Date() })
    .where(and(eq(cropSeasons.id, id), eq(cropSeasons.userId, session.user.id)))
    .returning()

  revalidate()
  return season
}

export async function deleteSeason(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .update(cropSeasons)
    .set({ deletedAt: new Date() })
    .where(and(eq(cropSeasons.id, id), eq(cropSeasons.userId, session.user.id)))

  revalidate()
}

// ─── CROP PLANS ──────────────────────────────────────────────────────────────

export async function getCropPlans(seasonId?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.cropPlans.findMany({
    where: and(
      eq(cropPlans.userId, session.user.id),
      isNull(cropPlans.deletedAt),
      seasonId ? eq(cropPlans.seasonId, seasonId) : undefined
    ),
    with: { crop: true, plot: true, season: true },
    orderBy: [asc(cropPlans.plannedPlantingDate)],
  })
}

export async function createCropPlan(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = cropPlanSchema.parse(data)
  const [plan] = await db
    .insert(cropPlans)
    .values({
      userId: session.user.id,
      seasonId: validated.seasonId ?? null,
      cropId: validated.cropId,
      plotId: validated.plotId ?? null,
      plannedPlantingDate: validated.plannedPlantingDate ?? null,
      plannedHarvestDate: validated.plannedHarvestDate ?? null,
      targetQuantity: validated.targetQuantity?.toString() ?? null,
      targetUnit: validated.targetUnit ?? null,
      estimatedCost: validated.estimatedCost?.toString() ?? null,
      status: validated.status,
      notes: validated.notes,
    })
    .returning()

  revalidate()
  return plan
}

export async function updateCropPlan(id: string, data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = cropPlanSchema.parse(data)
  const [plan] = await db
    .update(cropPlans)
    .set({
      seasonId: validated.seasonId ?? null,
      cropId: validated.cropId,
      plotId: validated.plotId ?? null,
      plannedPlantingDate: validated.plannedPlantingDate ?? null,
      plannedHarvestDate: validated.plannedHarvestDate ?? null,
      targetQuantity: validated.targetQuantity?.toString() ?? null,
      targetUnit: validated.targetUnit ?? null,
      estimatedCost: validated.estimatedCost?.toString() ?? null,
      status: validated.status,
      notes: validated.notes,
      updatedAt: new Date(),
    })
    .where(and(eq(cropPlans.id, id), eq(cropPlans.userId, session.user.id)))
    .returning()

  revalidate()
  return plan
}

export async function deleteCropPlan(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .update(cropPlans)
    .set({ deletedAt: new Date() })
    .where(and(eq(cropPlans.id, id), eq(cropPlans.userId, session.user.id)))

  revalidate()
}

// ─── CALENDAR DATA ───────────────────────────────────────────────────────────

export async function getCalendarEvents(year: number, month: number) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`
  const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]

  const plans = await db.query.cropPlans.findMany({
    where: and(
      eq(cropPlans.userId, session.user.id),
      isNull(cropPlans.deletedAt),
      sql`(
                (${cropPlans.plannedPlantingDate} BETWEEN ${startOfMonth} AND ${endOfMonth})
                OR (${cropPlans.plannedHarvestDate} BETWEEN ${startOfMonth} AND ${endOfMonth})
            )`
    ),
    with: { crop: true, plot: true, season: true },
  })

  const events: Array<{
    id: string
    date: string
    type: 'planting' | 'harvest'
    cropName: string
    plotName: string | null
    seasonName: string | null
    status: string
    planId: string
  }> = []

  for (const plan of plans) {
    if (
      plan.plannedPlantingDate &&
      plan.plannedPlantingDate >= startOfMonth &&
      plan.plannedPlantingDate <= endOfMonth
    ) {
      events.push({
        id: `${plan.id}-plant`,
        date: plan.plannedPlantingDate,
        type: 'planting',
        cropName: plan.crop?.name ?? 'Unknown',
        plotName: plan.plot?.name ?? null,
        seasonName: plan.season?.name ?? null,
        status: plan.status ?? 'planned',
        planId: plan.id,
      })
    }
    if (
      plan.plannedHarvestDate &&
      plan.plannedHarvestDate >= startOfMonth &&
      plan.plannedHarvestDate <= endOfMonth
    ) {
      events.push({
        id: `${plan.id}-harvest`,
        date: plan.plannedHarvestDate,
        type: 'harvest',
        cropName: plan.crop?.name ?? 'Unknown',
        plotName: plan.plot?.name ?? null,
        seasonName: plan.season?.name ?? null,
        status: plan.status ?? 'planned',
        planId: plan.id,
      })
    }
  }

  return events
}

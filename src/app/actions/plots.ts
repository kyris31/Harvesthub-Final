'use server'

import { db } from '@/lib/db'
import { plots, plantingLogs, cropPlans, harvestLogs, saleItems } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { plotSchema } from '@/lib/validations/plots'
import { eq, and, isNull, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

const revalidate = () => {
  revalidatePath('/dashboard/plots')
  revalidatePath('/dashboard/plots/report')
}

// ─── PLOTS ───────────────────────────────────────────────────────────────────

export async function getPlots() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.plots.findMany({
    where: and(eq(plots.userId, session.user.id), isNull(plots.deletedAt)),
    with: {
      plantingLogs: {
        where: and(isNull(plantingLogs.deletedAt)),
        columns: { id: true, status: true, cropId: true },
        with: { crop: { columns: { name: true } } },
      },
      cropPlans: {
        where: isNull(cropPlans.deletedAt),
        columns: { id: true, status: true },
      },
    },
    orderBy: [plots.name],
  })
}

export async function getPlotById(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.plots.findFirst({
    where: and(eq(plots.id, id), eq(plots.userId, session.user.id), isNull(plots.deletedAt)),
    with: {
      plantingLogs: {
        where: isNull(plantingLogs.deletedAt),
        with: {
          crop: true,
          harvestLogs: {
            where: isNull(harvestLogs.deletedAt),
            orderBy: [desc(harvestLogs.harvestDate)],
          },
        },
        orderBy: [desc(plantingLogs.plantingDate)],
      },
      cropPlans: {
        where: isNull(cropPlans.deletedAt),
        with: { crop: true, season: true },
        orderBy: [desc(cropPlans.plannedPlantingDate)],
      },
    },
  })
}

export async function createPlot(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = plotSchema.parse(data)
  const [plot] = await db
    .insert(plots)
    .values({
      ...validated,
      areaSqm: validated.areaSqm?.toString() ?? null,
      userId: session.user.id,
    })
    .returning()

  revalidate()
  return plot
}

export async function updatePlot(id: string, data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validated = plotSchema.parse(data)
  const [plot] = await db
    .update(plots)
    .set({
      ...validated,
      areaSqm: validated.areaSqm?.toString() ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(plots.id, id), eq(plots.userId, session.user.id)))
    .returning()

  revalidatePath(`/dashboard/plots/${id}`)
  revalidate()
  return plot
}

export async function deletePlot(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  await db
    .update(plots)
    .set({ deletedAt: new Date() })
    .where(and(eq(plots.id, id), eq(plots.userId, session.user.id)))

  revalidate()
}

// ─── ZONE REPORT ─────────────────────────────────────────────────────────────

export async function getPlotReport() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const allPlots = await db.query.plots.findMany({
    where: and(eq(plots.userId, session.user.id), isNull(plots.deletedAt)),
    with: {
      plantingLogs: {
        where: isNull(plantingLogs.deletedAt),
        with: {
          crop: { columns: { name: true, category: true } },
          harvestLogs: {
            where: isNull(harvestLogs.deletedAt),
            with: {
              saleItems: { columns: { subtotal: true } },
            },
          },
        },
      },
      cropPlans: {
        where: and(isNull(cropPlans.deletedAt)),
        columns: { id: true, status: true },
      },
    },
    orderBy: [plots.name],
  })

  return allPlots.map((plot) => {
    const activePlantings = plot.plantingLogs.filter((l) => l.status === 'active')
    const completedPlantings = plot.plantingLogs.filter(
      (l) => l.status === 'harvested' || l.status === 'completed'
    )
    const totalHarvestedKg = plot.plantingLogs.reduce(
      (sum, l) =>
        sum + l.harvestLogs.reduce((s, h) => s + parseFloat(h.quantityHarvested ?? '0'), 0),
      0
    )
    const totalRevenue = plot.plantingLogs.reduce(
      (sum, l) =>
        sum +
        l.harvestLogs.reduce(
          (s, h) => s + h.saleItems.reduce((r, si) => r + parseFloat(si.subtotal ?? '0'), 0),
          0
        ),
      0
    )
    const activePlans = plot.cropPlans.filter(
      (p) => p.status === 'planned' || p.status === 'in_progress'
    )
    const cropNames = [...new Set(activePlantings.map((l) => l.crop?.name).filter(Boolean))]

    return {
      ...plot,
      activePlantingCount: activePlantings.length,
      completedPlantingCount: completedPlantings.length,
      activePlanCount: activePlans.length,
      totalHarvestedKg,
      totalRevenue,
      cropNames,
    }
  })
}

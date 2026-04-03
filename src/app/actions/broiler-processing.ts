'use server'

import { db } from '@/lib/db'
import {
  broilerProcessingRecords,
  flocks,
  feedUsageRecords,
  healthRecords,
  poultryFeedInventory,
} from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { broilerProcessingSchema } from '@/lib/validations/poultry'
import { eq, and, desc, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Create a processing record and mark flock as sold
export async function createProcessingRecord(data: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const validatedData = broilerProcessingSchema.parse(data)

  // Verify flock ownership
  const flock = await db.query.flocks.findFirst({
    where: and(
      eq(flocks.id, validatedData.flockId),
      eq(flocks.userId, session.user.id),
      sql`${flocks.deletedAt} IS NULL`
    ),
  })
  if (!flock) throw new Error('Flock not found')

  // Auto-calculate total revenue if not provided
  let totalRevenue = validatedData.totalRevenue
  if (!totalRevenue && validatedData.totalWeightKg && validatedData.pricePerKg) {
    totalRevenue = validatedData.totalWeightKg * validatedData.pricePerKg
  }

  // Auto-calculate avg weight if total provided
  let avgWeightKg = validatedData.avgWeightKg
  if (!avgWeightKg && validatedData.totalWeightKg && validatedData.birdsProcessed > 0) {
    avgWeightKg = validatedData.totalWeightKg / validatedData.birdsProcessed
  }

  const [record] = await db
    .insert(broilerProcessingRecords)
    .values({
      ...validatedData,
      userId: session.user.id,
      avgWeightKg: avgWeightKg?.toString(),
      totalWeightKg: validatedData.totalWeightKg?.toString(),
      pricePerKg: validatedData.pricePerKg?.toString(),
      totalRevenue: totalRevenue?.toString(),
      processingCost: validatedData.processingCost.toString(),
      transportCost: validatedData.transportCost.toString(),
      otherCosts: validatedData.otherCosts.toString(),
    })
    .returning()

  // Update flock status to 'sold' and update current count
  const remainingBirds = flock.currentCount - validatedData.birdsProcessed
  await db
    .update(flocks)
    .set({
      status: remainingBirds <= 0 ? 'sold' : 'active',
      currentCount: Math.max(0, remainingBirds),
      updatedAt: new Date(),
    })
    .where(eq(flocks.id, validatedData.flockId))

  revalidatePath('/dashboard/poultry/flocks')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  revalidatePath('/dashboard/poultry/broiler-report')
  return record
}

// Get all processing records, optionally filtered by flock
export async function getProcessingRecords(flockId?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  return db.query.broilerProcessingRecords.findMany({
    where: and(
      eq(broilerProcessingRecords.userId, session.user.id),
      flockId ? eq(broilerProcessingRecords.flockId, flockId) : undefined
    ),
    with: { flock: true },
    orderBy: [desc(broilerProcessingRecords.processingDate)],
  })
}

// Full profit report for a single flock
export async function getFlockProfitReport(flockId: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const [flock, feedUsage, healthCosts, processingRecs] = await Promise.all([
    db.query.flocks.findFirst({
      where: and(eq(flocks.id, flockId), eq(flocks.userId, session.user.id)),
    }),
    // Feed usage joined with feed inventory to get cost per unit
    db
      .select({
        quantityUsed: feedUsageRecords.quantityUsed,
        costPerUnit: poultryFeedInventory.costPerUnit,
        feedType: poultryFeedInventory.feedType,
        usageDate: feedUsageRecords.usageDate,
      })
      .from(feedUsageRecords)
      .leftJoin(poultryFeedInventory, eq(feedUsageRecords.feedId, poultryFeedInventory.id))
      .where(
        and(eq(feedUsageRecords.flockId, flockId), eq(feedUsageRecords.userId, session.user.id))
      )
      .orderBy(feedUsageRecords.usageDate),
    db.query.healthRecords.findMany({
      where: and(eq(healthRecords.flockId, flockId), eq(healthRecords.userId, session.user.id)),
    }),
    db.query.broilerProcessingRecords.findMany({
      where: and(
        eq(broilerProcessingRecords.flockId, flockId),
        eq(broilerProcessingRecords.userId, session.user.id)
      ),
      orderBy: [desc(broilerProcessingRecords.processingDate)],
    }),
  ])

  if (!flock) throw new Error('Flock not found')

  // --- COST CALCULATIONS ---
  const chickCost = parseFloat(flock.totalCost || '0')

  // Feed: sum(quantityUsed × costPerUnit)
  const totalFeedCost = feedUsage.reduce((sum, row) => {
    const qty = parseFloat(row.quantityUsed || '0')
    const cost = parseFloat(row.costPerUnit || '0')
    return sum + qty * cost
  }, 0)

  const totalFeedKg = feedUsage.reduce((sum, row) => sum + parseFloat(row.quantityUsed || '0'), 0)

  const totalHealthCost = healthCosts.reduce((sum, r) => sum + parseFloat(r.cost || '0'), 0)

  const processingExtraCosts = processingRecs.reduce((sum, r) => {
    return (
      sum +
      parseFloat(r.processingCost || '0') +
      parseFloat(r.transportCost || '0') +
      parseFloat(r.otherCosts || '0')
    )
  }, 0)

  const totalCosts = chickCost + totalFeedCost + totalHealthCost + processingExtraCosts

  // --- REVENUE ---
  const totalRevenue = processingRecs.reduce((sum, r) => sum + parseFloat(r.totalRevenue || '0'), 0)
  const totalWeightKg = processingRecs.reduce(
    (sum, r) => sum + parseFloat(r.totalWeightKg || '0'),
    0
  )
  const totalBirdsProcessed = processingRecs.reduce((sum, r) => sum + r.birdsProcessed, 0)

  // --- PROFIT ---
  const netProfit = totalRevenue - totalCosts
  const profitPerBird = totalBirdsProcessed > 0 ? netProfit / totalBirdsProcessed : 0
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  // FCR = total feed kg / total live weight kg
  const fcr = totalWeightKg > 0 ? totalFeedKg / totalWeightKg : 0

  // Days: from dateAcquired to latest processing date
  const latestProcessing = processingRecs[0]?.processingDate
  const daysToProcess = latestProcessing
    ? Math.ceil(
        (new Date(latestProcessing).getTime() - new Date(flock.dateAcquired).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : Math.ceil((Date.now() - new Date(flock.dateAcquired).getTime()) / (1000 * 60 * 60 * 24))

  return {
    flock,
    processingRecords: processingRecs,
    feedUsage,
    costs: {
      chickCost,
      totalFeedCost,
      totalHealthCost,
      processingExtraCosts,
      totalCosts,
    },
    revenue: {
      totalRevenue,
      totalWeightKg,
      totalBirdsProcessed,
    },
    profit: {
      netProfit,
      profitPerBird,
      profitMargin,
    },
    metrics: {
      fcr,
      daysToProcess,
      totalFeedKg,
      mortalityCount: flock.initialCount - flock.currentCount - totalBirdsProcessed,
    },
  }
}

// Summary of ALL broiler flocks for the report page
export async function getAllBroilerFlocksSummary() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Unauthorized')

  const broilerFlocks = await db.query.flocks.findMany({
    where: and(
      eq(flocks.userId, session.user.id),
      eq(flocks.purpose, 'broilers'),
      sql`${flocks.deletedAt} IS NULL`
    ),
    with: {
      processingRecords: true,
      feedUsageRecords: {
        with: { feed: true },
      },
      healthRecords: true,
    },
    orderBy: [desc(flocks.dateAcquired)],
  })

  return broilerFlocks.map((flock) => {
    const chickCost = parseFloat(flock.totalCost || '0')

    const totalFeedCost = flock.feedUsageRecords.reduce((sum, r) => {
      const qty = parseFloat(r.quantityUsed || '0')
      const cost = parseFloat((r.feed as any)?.costPerUnit || '0')
      return sum + qty * cost
    }, 0)

    const totalFeedKg = flock.feedUsageRecords.reduce(
      (sum, r) => sum + parseFloat(r.quantityUsed || '0'),
      0
    )

    const totalHealthCost = flock.healthRecords.reduce(
      (sum, r) => sum + parseFloat(r.cost || '0'),
      0
    )

    const processingExtraCosts = flock.processingRecords.reduce((sum, r) => {
      return (
        sum +
        parseFloat(r.processingCost || '0') +
        parseFloat(r.transportCost || '0') +
        parseFloat(r.otherCosts || '0')
      )
    }, 0)

    const totalCosts = chickCost + totalFeedCost + totalHealthCost + processingExtraCosts
    const totalRevenue = flock.processingRecords.reduce(
      (sum, r) => sum + parseFloat(r.totalRevenue || '0'),
      0
    )
    const totalWeightKg = flock.processingRecords.reduce(
      (sum, r) => sum + parseFloat(r.totalWeightKg || '0'),
      0
    )
    const totalBirdsProcessed = flock.processingRecords.reduce(
      (sum, r) => sum + r.birdsProcessed,
      0
    )

    const netProfit = totalRevenue - totalCosts
    const profitPerBird = totalBirdsProcessed > 0 ? netProfit / totalBirdsProcessed : 0
    const fcr = totalWeightKg > 0 ? totalFeedKg / totalWeightKg : 0

    const latestProcessing = flock.processingRecords[0]?.processingDate
    const daysToProcess = latestProcessing
      ? Math.ceil(
          (new Date(latestProcessing).getTime() - new Date(flock.dateAcquired).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : Math.ceil((Date.now() - new Date(flock.dateAcquired).getTime()) / (1000 * 60 * 60 * 24))

    const isCompleted = flock.processingRecords.length > 0 && flock.status === 'sold'

    return {
      id: flock.id,
      name: flock.name,
      status: flock.status,
      isCompleted,
      initialCount: flock.initialCount,
      currentCount: flock.currentCount,
      totalBirdsProcessed,
      dateAcquired: flock.dateAcquired,
      daysToProcess,
      chickCost,
      totalFeedCost,
      totalHealthCost,
      processingExtraCosts,
      totalCosts,
      totalRevenue,
      totalWeightKg,
      netProfit,
      profitPerBird,
      fcr,
    }
  })
}

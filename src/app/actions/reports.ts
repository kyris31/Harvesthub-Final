'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  sales,
  saleItems,
  expenses,
  harvestLogs,
  cultivationActivities,
  cultivationActivityInputs,
  seedBatches,
  inputInventory,
  purchasedSeedlings,
  plantingLogs,
  seedlingProductionLogs,
  crops,
} from '@/lib/db/schema'
import { and, eq, isNull, gte, lte, sql, count, inArray } from 'drizzle-orm'

// Financial Report
export async function getFinancialReport(startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [isNull(sales.deletedAt)]

  if (startDate) {
    whereConditions.push(gte(sales.saleDate, startDate))
  }

  if (endDate) {
    whereConditions.push(lte(sales.saleDate, endDate))
  }

  // Get total revenue
  const revenue = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${sales.totalAmount} AS DECIMAL)), 0)`,
      count: count(),
    })
    .from(sales)
    .where(and(eq(sales.userId, session.user.id), ...whereConditions))

  // Get expenses
  const expenseConditions = [isNull(expenses.deletedAt)]

  if (startDate) {
    expenseConditions.push(gte(expenses.expenseDate, startDate))
  }

  if (endDate) {
    expenseConditions.push(lte(expenses.expenseDate, endDate))
  }

  const expenseData = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`,
      count: count(),
    })
    .from(expenses)
    .where(and(eq(expenses.userId, session.user.id), ...expenseConditions))

  // Get cultivation activity costs
  const activityConditions = [isNull(cultivationActivities.deletedAt)]

  if (startDate) {
    activityConditions.push(gte(cultivationActivities.activityDate, startDate))
  }

  if (endDate) {
    activityConditions.push(lte(cultivationActivities.activityDate, endDate))
  }

  const activityCosts = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${cultivationActivityInputs.cost} AS DECIMAL)), 0)`,
    })
    .from(cultivationActivityInputs)
    .innerJoin(
      cultivationActivities,
      eq(cultivationActivityInputs.cultivationActivityId, cultivationActivities.id)
    )
    .where(and(eq(cultivationActivities.userId, session.user.id), ...activityConditions))

  const totalRevenue = Number(revenue[0]?.total || 0)
  const totalExpenses = Number(expenseData[0]?.total || 0) + Number(activityCosts[0]?.total || 0)
  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    revenue: {
      total: totalRevenue,
      count: revenue[0]?.count || 0,
    },
    expenses: {
      total: totalExpenses,
      count: expenseData[0]?.count || 0,
    },
    profit: {
      total: netProfit,
      margin: profitMargin,
    },
  }
}

// Harvest Report
export async function getHarvestReport(startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [eq(harvestLogs.userId, session.user.id), isNull(harvestLogs.deletedAt)]

  if (startDate) {
    whereConditions.push(gte(harvestLogs.harvestDate, startDate))
  }

  if (endDate) {
    whereConditions.push(lte(harvestLogs.harvestDate, endDate))
  }

  const harvests = await db.query.harvestLogs.findMany({
    where: and(...whereConditions),
    orderBy: (harvestLogs, { desc }) => [desc(harvestLogs.harvestDate)],
    with: { plantingLog: { with: { crop: true } } },
  })

  const totalYield = harvests.reduce((sum, h) => sum + Number(h.quantityHarvested || 0), 0)

  return {
    harvests,
    totalYield,
    harvestCount: harvests.length,
  }
}

// Inventory Report
export async function getInventoryReport() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Get seed batches
  const seeds = await db.query.seedBatches.findMany({
    where: and(eq(seedBatches.userId, session.user.id), isNull(seedBatches.deletedAt)),
    with: { crop: true },
  })

  // Get input inventory
  const inputs = await db.query.inputInventory.findMany({
    where: and(eq(inputInventory.userId, session.user.id), isNull(inputInventory.deletedAt)),
  })

  // Get purchased seedlings
  const seedlings = await db.query.purchasedSeedlings.findMany({
    where: and(
      eq(purchasedSeedlings.userId, session.user.id),
      isNull(purchasedSeedlings.deletedAt)
    ),
  })

  // Calculate low stock items
  const lowStockInputs = inputs.filter((i) => {
    const current = Number(i.currentQuantity || 0)
    const min = Number(i.minimumStockLevel || 10)
    return current <= min
  })

  const lowStockSeedlings = seedlings.filter((s) => {
    const current = Number(s.currentQuantity || 0)
    return current <= 10 // threshold of 10 units
  })

  // Calculate total inventory value.
  // Prefer costPerUnit * currentQuantity; fall back to totalCost * (current/initial) when
  // costPerUnit is absent (user entered only a total cost).
  const itemValue = (current: number, initial: number, costPerUnit: number, totalCost: number) => {
    if (costPerUnit > 0) return current * costPerUnit
    if (totalCost > 0 && initial > 0) return totalCost * (current / initial)
    if (totalCost > 0) return totalCost
    return 0
  }

  const seedValue = seeds.reduce((sum, s) => {
    return (
      sum +
      itemValue(
        Number(s.currentQuantity || 0),
        Number(s.initialQuantity || 0),
        Number(s.costPerUnit || 0),
        Number(s.totalCost || 0)
      )
    )
  }, 0)

  const inputValue = inputs.reduce((sum, i) => {
    return (
      sum +
      itemValue(
        Number(i.currentQuantity || 0),
        Number(i.initialQuantity || 0),
        Number(i.costPerUnit || 0),
        Number(i.totalCost || 0)
      )
    )
  }, 0)

  const seedlingValue = seedlings.reduce(
    (sum, s) => sum + Number(s.currentQuantity || 0) * Number(s.costPerSeedling || 0),
    0
  )

  return {
    seeds: {
      items: seeds,
      totalValue: seedValue,
    },
    inputs: {
      items: inputs,
      lowStock: lowStockInputs,
      totalValue: inputValue,
    },
    seedlings: {
      items: seedlings,
      lowStock: lowStockSeedlings,
      totalValue: seedlingValue,
    },
    totalValue: seedValue + inputValue + seedlingValue,
    lowStockCount: lowStockInputs.length + lowStockSeedlings.length,
  }
}

// Planting Log Report
export async function getPlantingReport(startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const conditions = [eq(plantingLogs.userId, session.user.id), isNull(plantingLogs.deletedAt)]
  if (startDate) conditions.push(gte(plantingLogs.plantingDate, startDate))
  if (endDate) conditions.push(lte(plantingLogs.plantingDate, endDate))

  const logs = await db.query.plantingLogs.findMany({
    where: and(...conditions),
    orderBy: (pl, { desc }) => [desc(pl.plantingDate)],
    with: {
      crop: { columns: { name: true, variety: true } },
      plot: { columns: { name: true } },
    },
  })

  return {
    logs,
    total: logs.length,
    active: logs.filter((l) => l.status === 'active').length,
    harvested: logs.filter((l) => l.status === 'harvested').length,
    failed: logs.filter((l) => l.status === 'failed').length,
  }
}

// Crop Performance Report
export async function getCropPerformanceReport(startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const userId = session.user.id

  const userCrops = await db.query.crops.findMany({
    where: and(eq(crops.userId, userId), isNull(crops.deletedAt)),
    columns: { id: true, name: true, variety: true },
  })
  if (userCrops.length === 0) return []

  const cropIds = userCrops.map((c) => c.id)

  // Total planted per crop (filtered by plantingDate)
  const plantedConds = [
    eq(plantingLogs.userId, userId),
    isNull(plantingLogs.deletedAt),
    inArray(plantingLogs.cropId, cropIds),
  ]
  if (startDate) plantedConds.push(gte(plantingLogs.plantingDate, startDate))
  if (endDate) plantedConds.push(lte(plantingLogs.plantingDate, endDate))
  const plantedRows = await db
    .select({
      cropId: plantingLogs.cropId,
      total: sql<string>`COALESCE(SUM(${plantingLogs.quantityPlanted}), '0')`,
    })
    .from(plantingLogs)
    .where(and(...plantedConds))
    .groupBy(plantingLogs.cropId)

  // Seedlings produced per crop (filtered by sowingDate)
  const seedlingConds = [
    eq(seedlingProductionLogs.userId, userId),
    isNull(seedlingProductionLogs.deletedAt),
    inArray(seedlingProductionLogs.cropId, cropIds),
  ]
  if (startDate) seedlingConds.push(gte(seedlingProductionLogs.sowingDate, startDate))
  if (endDate) seedlingConds.push(lte(seedlingProductionLogs.sowingDate, endDate))
  const producedRows = await db
    .select({
      cropId: seedlingProductionLogs.cropId,
      total: sql<string>`COALESCE(SUM(${seedlingProductionLogs.actualSeedlingsProduced}), '0')`,
    })
    .from(seedlingProductionLogs)
    .where(and(...seedlingConds))
    .groupBy(seedlingProductionLogs.cropId)

  // Total harvested per crop (filtered by harvestDate)
  const harvestConds = [eq(harvestLogs.userId, userId), isNull(harvestLogs.deletedAt)]
  if (startDate) harvestConds.push(gte(harvestLogs.harvestDate, startDate))
  if (endDate) harvestConds.push(lte(harvestLogs.harvestDate, endDate))
  const harvestedRows = await db
    .select({
      cropId: plantingLogs.cropId,
      total: sql<string>`COALESCE(SUM(${harvestLogs.quantityHarvested}), '0')`,
    })
    .from(harvestLogs)
    .innerJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
    .where(and(...harvestConds))
    .groupBy(plantingLogs.cropId)

  // Total sold per crop (via saleItems -> harvestLogs -> plantingLogs, filtered by saleDate)
  const saleConds = [
    eq(harvestLogs.userId, userId),
    isNull(harvestLogs.deletedAt),
    isNull(sales.deletedAt),
  ]
  if (startDate) saleConds.push(gte(sales.saleDate, startDate))
  if (endDate) saleConds.push(lte(sales.saleDate, endDate))
  const soldRows = await db
    .select({
      cropId: plantingLogs.cropId,
      total: sql<string>`COALESCE(SUM(${saleItems.quantity}), '0')`,
    })
    .from(saleItems)
    .innerJoin(harvestLogs, eq(saleItems.harvestLogId, harvestLogs.id))
    .innerJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(and(...saleConds))
    .groupBy(plantingLogs.cropId)

  const plantedMap = new Map(plantedRows.map((r) => [r.cropId, Number(r.total)]))
  const producedMap = new Map(producedRows.map((r) => [r.cropId, Number(r.total)]))
  const harvestedMap = new Map(harvestedRows.map((r) => [r.cropId, Number(r.total)]))
  const soldMap = new Map(soldRows.map((r) => [r.cropId, Number(r.total)]))

  return userCrops
    .map((crop) => {
      const totalPlanted = plantedMap.get(crop.id) ?? 0
      const plantsProduced = producedMap.get(crop.id) ?? 0
      const totalProduced = harvestedMap.get(crop.id) ?? 0
      const totalSales = soldMap.get(crop.id) ?? 0
      return {
        cropId: crop.id,
        cropName: crop.name + (crop.variety ? ` - ${crop.variety}` : ''),
        totalPlanted,
        plantsProduced,
        totalProduced,
        totalSales,
        difference: totalProduced - totalSales,
      }
    })
    .filter(
      (r) => r.totalPlanted > 0 || r.plantsProduced > 0 || r.totalProduced > 0 || r.totalSales > 0
    )
}

// Crop Lifecycle Report — self-produced seedlings, purchased seedlings, and direct sow
export async function getCropLifecycleReport(startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const userId = session.user.id

  // ── Self-produced seedlings ──────────────────────────────────────────────
  const selfConds = [
    eq(seedlingProductionLogs.userId, userId),
    isNull(seedlingProductionLogs.deletedAt),
  ]
  if (startDate) selfConds.push(gte(seedlingProductionLogs.sowingDate, startDate))
  if (endDate) selfConds.push(lte(seedlingProductionLogs.sowingDate, endDate))

  const selfLogs = await db.query.seedlingProductionLogs.findMany({
    where: and(...selfConds),
    with: { crop: { columns: { name: true, variety: true } } },
  })

  // Harvested via selfProducedSeedlingId FK (accurate for records saved after the FK fix)
  const selfIds = selfLogs.map((l) => l.id)
  const selfHarvestedRows =
    selfIds.length > 0
      ? await db
          .select({
            seedlingId: plantingLogs.selfProducedSeedlingId,
            total: sql<string>`COALESCE(SUM(${harvestLogs.quantityHarvested}), '0')`,
          })
          .from(harvestLogs)
          .innerJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
          .where(
            and(
              inArray(plantingLogs.selfProducedSeedlingId, selfIds),
              isNull(harvestLogs.deletedAt),
              isNull(plantingLogs.deletedAt)
            )
          )
          .groupBy(plantingLogs.selfProducedSeedlingId)
      : []

  const selfSoldRows =
    selfIds.length > 0
      ? await db
          .select({
            seedlingId: plantingLogs.selfProducedSeedlingId,
            total: sql<string>`COALESCE(SUM(${saleItems.quantity}), '0')`,
          })
          .from(saleItems)
          .innerJoin(harvestLogs, eq(saleItems.harvestLogId, harvestLogs.id))
          .innerJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
          .innerJoin(sales, eq(saleItems.saleId, sales.id))
          .where(
            and(
              inArray(plantingLogs.selfProducedSeedlingId, selfIds),
              isNull(harvestLogs.deletedAt),
              isNull(plantingLogs.deletedAt),
              isNull(sales.deletedAt)
            )
          )
          .groupBy(plantingLogs.selfProducedSeedlingId)
      : []

  const selfHarvestedMap = new Map(selfHarvestedRows.map((r) => [r.seedlingId, Number(r.total)]))
  const selfSoldMap = new Map(selfSoldRows.map((r) => [r.seedlingId, Number(r.total)]))

  const selfRows = selfLogs.map((log) => {
    const produced = log.actualSeedlingsProduced ?? 0
    const remaining = log.currentSeedlingsAvailable ?? 0
    // Transplanted = produced − remaining (avoids FK NULL issue for older records)
    const transplanted = Math.max(0, produced - remaining)
    return {
      id: `self_${log.id}`,
      cropName: log.crop.name + (log.crop.variety ? ` - ${log.crop.variety}` : ''),
      sourceLabel: 'Self-Produced',
      sowingDate: log.sowingDate,
      sownQty: `${log.quantitySown} ${log.sowingUnit}`,
      produced,
      transplanted,
      harvested: selfHarvestedMap.get(log.id) ?? 0,
      sold: selfSoldMap.get(log.id) ?? 0,
      remaining,
    }
  })

  // ── Purchased seedlings ──────────────────────────────────────────────────
  const purchConds = [eq(purchasedSeedlings.userId, userId), isNull(purchasedSeedlings.deletedAt)]
  if (startDate) purchConds.push(gte(purchasedSeedlings.purchaseDate, startDate))
  if (endDate) purchConds.push(lte(purchasedSeedlings.purchaseDate, endDate))

  const purchLogs = await db.query.purchasedSeedlings.findMany({
    where: and(...purchConds),
    with: { crop: { columns: { name: true, variety: true } } },
  })

  // Harvested via purchasedSeedlingId FK
  const purchIds = purchLogs.map((l) => l.id)
  const purchHarvestedRows =
    purchIds.length > 0
      ? await db
          .select({
            seedlingId: plantingLogs.purchasedSeedlingId,
            total: sql<string>`COALESCE(SUM(${harvestLogs.quantityHarvested}), '0')`,
          })
          .from(harvestLogs)
          .innerJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
          .where(
            and(
              inArray(plantingLogs.purchasedSeedlingId, purchIds),
              isNull(harvestLogs.deletedAt),
              isNull(plantingLogs.deletedAt)
            )
          )
          .groupBy(plantingLogs.purchasedSeedlingId)
      : []

  const purchSoldRows =
    purchIds.length > 0
      ? await db
          .select({
            seedlingId: plantingLogs.purchasedSeedlingId,
            total: sql<string>`COALESCE(SUM(${saleItems.quantity}), '0')`,
          })
          .from(saleItems)
          .innerJoin(harvestLogs, eq(saleItems.harvestLogId, harvestLogs.id))
          .innerJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
          .innerJoin(sales, eq(saleItems.saleId, sales.id))
          .where(
            and(
              inArray(plantingLogs.purchasedSeedlingId, purchIds),
              isNull(harvestLogs.deletedAt),
              isNull(plantingLogs.deletedAt),
              isNull(sales.deletedAt)
            )
          )
          .groupBy(plantingLogs.purchasedSeedlingId)
      : []

  const purchHarvestedMap = new Map(purchHarvestedRows.map((r) => [r.seedlingId, Number(r.total)]))
  const purchSoldMap = new Map(purchSoldRows.map((r) => [r.seedlingId, Number(r.total)]))

  const purchRows = purchLogs.map((log) => {
    const produced = log.quantityPurchased
    const remaining = log.currentQuantity
    const transplanted = Math.max(0, produced - remaining)
    return {
      id: `purch_${log.id}`,
      cropName: log.crop.name + (log.crop.variety ? ` - ${log.crop.variety}` : ''),
      sourceLabel: 'Purchased',
      sowingDate: log.purchaseDate,
      sownQty: `${produced} seedlings`,
      produced,
      transplanted,
      harvested: purchHarvestedMap.get(log.id) ?? 0,
      sold: purchSoldMap.get(log.id) ?? 0,
      remaining,
    }
  })

  // ── Direct sow plantings ─────────────────────────────────────────────────
  const directConds = [
    eq(plantingLogs.userId, userId),
    isNull(plantingLogs.deletedAt),
    sql`${plantingLogs.plantingSource} = 'direct_sow'`,
  ]
  if (startDate) directConds.push(gte(plantingLogs.plantingDate, startDate))
  if (endDate) directConds.push(lte(plantingLogs.plantingDate, endDate))

  const directLogs = await db.query.plantingLogs.findMany({
    where: and(...directConds),
    with: { crop: { columns: { name: true, variety: true } } },
  })

  const directIds = directLogs.map((l) => l.id)

  const directHarvestedRows =
    directIds.length > 0
      ? await db
          .select({
            plantingId: harvestLogs.plantingLogId,
            total: sql<string>`COALESCE(SUM(${harvestLogs.quantityHarvested}), '0')`,
          })
          .from(harvestLogs)
          .where(and(inArray(harvestLogs.plantingLogId, directIds), isNull(harvestLogs.deletedAt)))
          .groupBy(harvestLogs.plantingLogId)
      : []

  const directSoldRows =
    directIds.length > 0
      ? await db
          .select({
            plantingId: harvestLogs.plantingLogId,
            total: sql<string>`COALESCE(SUM(${saleItems.quantity}), '0')`,
          })
          .from(saleItems)
          .innerJoin(harvestLogs, eq(saleItems.harvestLogId, harvestLogs.id))
          .innerJoin(sales, eq(saleItems.saleId, sales.id))
          .where(
            and(
              inArray(harvestLogs.plantingLogId, directIds),
              isNull(harvestLogs.deletedAt),
              isNull(sales.deletedAt)
            )
          )
          .groupBy(harvestLogs.plantingLogId)
      : []

  const directHarvestedMap = new Map(
    directHarvestedRows.map((r) => [r.plantingId, Number(r.total)])
  )
  const directSoldMap = new Map(directSoldRows.map((r) => [r.plantingId, Number(r.total)]))

  const directRows = directLogs.map((log) => ({
    id: `direct_${log.id}`,
    cropName: log.crop.name + (log.crop.variety ? ` - ${log.crop.variety}` : ''),
    sourceLabel: 'Direct Sow',
    sowingDate: log.plantingDate,
    sownQty: `${log.quantityPlanted} ${log.quantityUnit}`,
    produced: null as number | null,
    transplanted: null as number | null,
    harvested: directHarvestedMap.get(log.id) ?? 0,
    sold: directSoldMap.get(log.id) ?? 0,
    remaining: null as number | null,
  }))

  // Combine and sort alphabetically by crop name
  return [...selfRows, ...purchRows, ...directRows].sort((a, b) =>
    a.cropName.localeCompare(b.cropName, 'el')
  )
}

// Keep old name as alias for any existing callers
export const getSeedlingLifecycleReport = getCropLifecycleReport

// Cultivation Activity Report
export async function getCultivationReport(startDate?: string, endDate?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [
    eq(cultivationActivities.userId, session.user.id),
    isNull(cultivationActivities.deletedAt),
  ]

  if (startDate) {
    whereConditions.push(gte(cultivationActivities.activityDate, startDate))
  }

  if (endDate) {
    whereConditions.push(lte(cultivationActivities.activityDate, endDate))
  }

  const activities = await db.query.cultivationActivities.findMany({
    where: and(...whereConditions),
    orderBy: (cultivationActivities, { desc }) => [desc(cultivationActivities.activityDate)],
    with: {
      activityInputs: {
        with: { inputInventory: true },
      },
      activityPlantings: {
        with: {
          plantingLog: {
            with: { crop: true, plot: true },
          },
        },
      },
    },
  })

  const activityCost = (a: (typeof activities)[number]) =>
    a.activityInputs.reduce((s, ai) => s + Number(ai.cost || 0), 0)

  // Group by activity type
  const activityByType = activities.reduce(
    (acc, activity) => {
      const type = activity.activityType
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalCost: 0,
        }
      }
      acc[type].count += 1
      acc[type].totalCost += activityCost(activity)
      return acc
    },
    {} as Record<string, { count: number; totalCost: number }>
  )

  const totalCost = activities.reduce((sum, a) => sum + activityCost(a), 0)

  return {
    activities,
    activityByType,
    totalActivities: activities.length,
    totalCost,
  }
}

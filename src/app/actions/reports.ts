'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  sales,
  expenses,
  harvestLogs,
  cultivationActivities,
  seedBatches,
  inputInventory,
  purchasedSeedlings,
} from '@/lib/db/schema'
import { and, eq, isNull, gte, lte, sql, count } from 'drizzle-orm'

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
      total: sql<number>`COALESCE(SUM(CAST(${cultivationActivities.cost} AS DECIMAL)), 0)`,
    })
    .from(cultivationActivities)
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

  // Calculate total inventory value - using costPerUnit for inputs
  const seedValue = seeds.reduce(
    (sum, s) => sum + Number(s.currentQuantity || 0) * Number(s.costPerUnit || 0),
    0
  )
  const inputValue = inputs.reduce(
    (sum, i) => sum + Number(i.currentQuantity || 0) * Number(i.costPerUnit || 0),
    0
  )
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
  })

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
      acc[type].totalCost += Number(activity.cost || 0)
      return acc
    },
    {} as Record<string, { count: number; totalCost: number }>
  )

  const totalCost = activities.reduce((sum, a) => sum + Number(a.cost || 0), 0)

  return {
    activities,
    activityByType,
    totalActivities: activities.length,
    totalCost,
  }
}

'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  crops,
  plots,
  plantingLogs,
  suppliers,
  harvestLogs,
  eggProduction,
  seedBatches,
  seedlingProductionLogs,
  purchasedSeedlings,
} from '@/lib/db/schema'
import { and, eq, isNull, gt, sql, asc } from 'drizzle-orm'

export async function getCropsForSelect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return await db.query.crops.findMany({
    where: and(eq(crops.userId, session.user.id), isNull(crops.deletedAt)),
    columns: {
      id: true,
      name: true,
      variety: true,
    },
    orderBy: (crops, { asc }) => [asc(crops.name)],
  })
}

export async function getSeedBatchesForSelect() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const rows = await db.query.seedBatches.findMany({
    where: and(
      eq(seedBatches.userId, session.user.id),
      isNull(seedBatches.deletedAt),
      gt(seedBatches.currentQuantity, '0')
    ),
    columns: {
      id: true,
      cropId: true,
      batchCode: true,
      currentQuantity: true,
      quantityUnit: true,
    },
    with: {
      crop: { columns: { name: true, variety: true } },
    },
    orderBy: (sb, { asc }) => [asc(sb.cropId)],
  })

  return rows
    .map((b) => ({
      id: b.id,
      cropId: b.cropId,
      batchCode: b.batchCode,
      currentQuantity: b.currentQuantity,
      quantityUnit: b.quantityUnit,
      crop: b.crop,
    }))
    .sort((a, b) =>
      `${a.crop.name} ${a.crop.variety ?? ''}`.localeCompare(
        `${b.crop.name} ${b.crop.variety ?? ''}`
      )
    )
}

export async function getSelfProducedSeedlingsForSelect() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const rows = await db.query.seedlingProductionLogs.findMany({
    where: and(
      eq(seedlingProductionLogs.userId, session.user.id),
      isNull(seedlingProductionLogs.deletedAt),
      gt(seedlingProductionLogs.currentSeedlingsAvailable, 0)
    ),
    columns: {
      id: true,
      cropId: true,
      sowingDate: true,
      currentSeedlingsAvailable: true,
    },
    with: {
      crop: { columns: { name: true, variety: true } },
    },
  })

  return rows
    .map((s) => ({
      id: s.id,
      cropId: s.cropId,
      productionDate: s.sowingDate,
      currentSeedlingsAvailable: s.currentSeedlingsAvailable,
      crop: s.crop,
    }))
    .sort((a, b) =>
      `${a.crop.name} ${a.crop.variety ?? ''}`.localeCompare(
        `${b.crop.name} ${b.crop.variety ?? ''}`
      )
    )
}

export async function getPurchasedSeedlingsForSelect() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const rows = await db.query.purchasedSeedlings.findMany({
    where: and(
      eq(purchasedSeedlings.userId, session.user.id),
      isNull(purchasedSeedlings.deletedAt),
      gt(purchasedSeedlings.currentQuantity, 0)
    ),
    columns: {
      id: true,
      cropId: true,
      purchaseDate: true,
      currentQuantity: true,
    },
    with: {
      crop: { columns: { name: true, variety: true } },
    },
  })

  return rows
    .map((s) => ({
      id: s.id,
      cropId: s.cropId,
      purchaseDate: s.purchaseDate,
      currentQuantity: s.currentQuantity,
      crop: s.crop,
    }))
    .sort((a, b) =>
      `${a.crop.name} ${a.crop.variety ?? ''}`.localeCompare(
        `${b.crop.name} ${b.crop.variety ?? ''}`
      )
    )
}

export async function getPlotsForSelect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return await db.query.plots.findMany({
    where: and(eq(plots.userId, session.user.id), isNull(plots.deletedAt)),
    columns: {
      id: true,
      name: true,
      areaSqm: true,
    },
  })
}

export async function getActivePlantingsForSelect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return await db.query.plantingLogs.findMany({
    where: and(
      eq(plantingLogs.userId, session.user.id),
      eq(plantingLogs.status, 'active'),
      isNull(plantingLogs.deletedAt)
    ),
    with: {
      crop: {
        columns: {
          name: true,
          variety: true,
        },
      },
      plot: {
        columns: {
          name: true,
        },
      },
    },
    columns: {
      id: true,
      plantingDate: true,
    },
  })
}

export async function getSuppliersForSelect() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  return await db.query.suppliers.findMany({
    where: and(eq(suppliers.userId, session.user.id), isNull(suppliers.deletedAt)),
    columns: {
      id: true,
      name: true,
    },
  })
}

export async function getAvailableHarvestsForSale() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Get harvests with current stock > 0
  const harvests = await db.query.harvestLogs.findMany({
    where: and(
      eq(harvestLogs.userId, session.user.id),
      isNull(harvestLogs.deletedAt),
      gt(harvestLogs.currentStock, '0')
    ),
    with: {
      plantingLog: {
        with: {
          crop: true,
        },
      },
    },
    orderBy: (harvestLogs, { desc }) => [desc(harvestLogs.harvestDate)],
  })

  const harvestResults = harvests.map((harvest) => ({
    id: harvest.id,
    productName: `${harvest.plantingLog.crop.name}${harvest.plantingLog.crop.variety ? ` (${harvest.plantingLog.crop.variety})` : ''}`,
    currentStock: harvest.currentStock,
    unit: harvest.quantityUnit,
    harvestDate: harvest.harvestDate,
    qualityGrade: harvest.qualityGrade || null,
  }))

  // Also include egg production records with available stock
  const eggRecords = await db.query.eggProduction.findMany({
    where: and(eq(eggProduction.userId, session.user.id), sql`${eggProduction.currentStock} > 0`),
    with: { flock: { columns: { name: true } } },
    orderBy: (ep, { desc }) => [desc(ep.collectionDate)],
  })

  const eggResults = eggRecords.map((e) => ({
    id: `egg:${e.id}`,
    productName: `Eggs — ${e.flock.name}`,
    currentStock: e.currentStock.toString(),
    unit: 'eggs',
    harvestDate: e.collectionDate,
    qualityGrade: null,
  }))

  return [...harvestResults, ...eggResults]
}

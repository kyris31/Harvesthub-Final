'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  plantingLogs,
  harvestLogs,
  seedlingProductionLogs,
  purchasedSeedlings,
  seedBatches,
} from '@/lib/db/schema'
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

async function validateSourceDate(validated: PlantingLogFormData) {
  if (validated.plantingSource === 'self_produced' && validated.selfProducedSeedlingId) {
    const seedling = await db.query.seedlingProductionLogs.findFirst({
      where: eq(seedlingProductionLogs.id, validated.selfProducedSeedlingId),
    })
    if (seedling?.sowingDate && validated.plantingDate < seedling.sowingDate) {
      throw new Error(
        `Planting date (${validated.plantingDate}) cannot be before the seedling sowing date (${seedling.sowingDate}).`
      )
    }
  }
  if (validated.plantingSource === 'purchased' && validated.purchasedSeedlingId) {
    const seedling = await db.query.purchasedSeedlings.findFirst({
      where: eq(purchasedSeedlings.id, validated.purchasedSeedlingId),
    })
    if (seedling?.purchaseDate && validated.plantingDate < seedling.purchaseDate) {
      throw new Error(
        `Planting date (${validated.plantingDate}) cannot be before the seedling purchase date (${seedling.purchaseDate}).`
      )
    }
  }
}

// Deduct planted quantity from the relevant inventory source.
async function deductInventoryStock(validated: PlantingLogFormData) {
  const plantedQty = parseFloat(validated.quantityPlanted)

  if (validated.plantingSource === 'direct_sow' && validated.seedBatchId) {
    const batch = await db.query.seedBatches.findFirst({
      where: eq(seedBatches.id, validated.seedBatchId),
    })
    if (!batch) throw new Error('Seed batch not found')
    const currentQty = parseFloat(batch.currentQuantity)
    if (currentQty < plantedQty) {
      throw new Error(
        `Insufficient stock in seed batch. Available: ${currentQty} ${batch.quantityUnit}`
      )
    }
    await db
      .update(seedBatches)
      .set({ currentQuantity: (currentQty - plantedQty).toFixed(2), updatedAt: new Date() })
      .where(eq(seedBatches.id, validated.seedBatchId))
  }

  if (validated.plantingSource === 'self_produced' && validated.selfProducedSeedlingId) {
    const log = await db.query.seedlingProductionLogs.findFirst({
      where: eq(seedlingProductionLogs.id, validated.selfProducedSeedlingId),
    })
    if (!log) throw new Error('Seedling production batch not found')
    const available = log.currentSeedlingsAvailable ?? 0
    const planted = Math.round(plantedQty)
    if (available < planted) {
      throw new Error(`Insufficient seedlings available. Available: ${available}`)
    }
    await db
      .update(seedlingProductionLogs)
      .set({ currentSeedlingsAvailable: available - planted, updatedAt: new Date() })
      .where(eq(seedlingProductionLogs.id, validated.selfProducedSeedlingId))
  }

  if (validated.plantingSource === 'purchased' && validated.purchasedSeedlingId) {
    const seedling = await db.query.purchasedSeedlings.findFirst({
      where: eq(purchasedSeedlings.id, validated.purchasedSeedlingId),
    })
    if (!seedling) throw new Error('Purchased seedling batch not found')
    const available = seedling.currentQuantity
    const planted = Math.round(plantedQty)
    if (available < planted) {
      throw new Error(`Insufficient seedlings. Available: ${available}`)
    }
    await db
      .update(purchasedSeedlings)
      .set({ currentQuantity: available - planted, updatedAt: new Date() })
      .where(eq(purchasedSeedlings.id, validated.purchasedSeedlingId))
  }
}

// Restore previously-deducted quantity back to the inventory source.
async function restoreInventoryStock(existing: {
  plantingSource: string
  seedBatchId: string | null
  selfProducedSeedlingId: string | null
  purchasedSeedlingId: string | null
  quantityPlanted: string
}) {
  const qty = parseFloat(existing.quantityPlanted)

  if (existing.plantingSource === 'direct_sow' && existing.seedBatchId) {
    const batch = await db.query.seedBatches.findFirst({
      where: eq(seedBatches.id, existing.seedBatchId),
    })
    if (batch) {
      await db
        .update(seedBatches)
        .set({
          currentQuantity: (parseFloat(batch.currentQuantity) + qty).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(seedBatches.id, existing.seedBatchId))
    }
  }

  if (existing.plantingSource === 'self_produced' && existing.selfProducedSeedlingId) {
    const log = await db.query.seedlingProductionLogs.findFirst({
      where: eq(seedlingProductionLogs.id, existing.selfProducedSeedlingId),
    })
    if (log) {
      await db
        .update(seedlingProductionLogs)
        .set({
          currentSeedlingsAvailable: (log.currentSeedlingsAvailable ?? 0) + Math.round(qty),
          updatedAt: new Date(),
        })
        .where(eq(seedlingProductionLogs.id, existing.selfProducedSeedlingId))
    }
  }

  if (existing.plantingSource === 'purchased' && existing.purchasedSeedlingId) {
    const seedling = await db.query.purchasedSeedlings.findFirst({
      where: eq(purchasedSeedlings.id, existing.purchasedSeedlingId),
    })
    if (seedling) {
      await db
        .update(purchasedSeedlings)
        .set({
          currentQuantity: seedling.currentQuantity + Math.round(qty),
          updatedAt: new Date(),
        })
        .where(eq(purchasedSeedlings.id, existing.purchasedSeedlingId))
    }
  }
}

function revalidateInventoryPaths() {
  revalidatePath('/dashboard/inventory/seed-batches')
  revalidatePath('/dashboard/inventory/seedlings')
  revalidatePath('/dashboard/inventory/seeds')
  revalidatePath('/dashboard/inventory')
}

export async function createPlantingLog(data: PlantingLogFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = plantingLogSchema.parse(data)
  await validateSourceDate(validated)

  // Deduct from inventory before inserting; throws if insufficient stock.
  await deductInventoryStock(validated)

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
  revalidateInventoryPaths()
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
  await validateSourceDate(validated)

  // Verify ownership and get old values for inventory reconciliation.
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

  // Restore old quantity to inventory, then deduct the new quantity.
  await restoreInventoryStock(existing)
  await deductInventoryStock(validated)

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
  revalidateInventoryPaths()
  return updated
}

export async function deletePlantingLog(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership.
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

  // Check for dependencies (harvests).
  const hasHarvests = await db.query.harvestLogs.findFirst({
    where: and(eq(harvestLogs.plantingLogId, id), isNull(harvestLogs.deletedAt)),
  })

  if (hasHarvests) {
    throw new Error('Cannot delete planting with harvest records. Please delete harvests first.')
  }

  // Restore inventory stock before soft-deleting.
  await restoreInventoryStock(existing)

  await db.update(plantingLogs).set({ deletedAt: new Date() }).where(eq(plantingLogs.id, id))

  revalidatePath('/dashboard/planting')
  revalidateInventoryPaths()
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { plantingLogs, crops, plots } from '@/lib/db/schema'
import { plantingLogSchema } from '@/lib/schemas/planting-schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/planting-logs - Fetch all planting logs for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPlantings = await db
      .select({
        id: plantingLogs.id,
        cropId: plantingLogs.cropId,
        cropName: crops.name,
        cropVariety: crops.variety,
        plotId: plantingLogs.plotId,
        plotName: plots.name,
        plantingDate: plantingLogs.plantingDate,
        quantityPlanted: plantingLogs.quantityPlanted,
        quantityUnit: plantingLogs.quantityUnit,
        expectedHarvestDate: plantingLogs.expectedHarvestDate,
        actualHarvestDate: plantingLogs.actualHarvestDate,
        status: plantingLogs.status,
        notes: plantingLogs.notes,
        createdAt: plantingLogs.createdAt,
        updatedAt: plantingLogs.updatedAt,
      })
      .from(plantingLogs)
      .leftJoin(crops, eq(plantingLogs.cropId, crops.id))
      .leftJoin(plots, eq(plantingLogs.plotId, plots.id))
      .where(and(eq(plantingLogs.userId, session.user.id), isNull(plantingLogs.deletedAt)))
      .orderBy(desc(plantingLogs.plantingDate))

    return NextResponse.json(userPlantings)
  } catch (error) {
    console.error('Error fetching planting logs:', error)
    return NextResponse.json({ error: 'Failed to fetch planting logs' }, { status: 500 })
  }
}

// POST /api/planting-logs - Create a new planting log
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = plantingLogSchema.parse(body)

    // Stock validation and deduction logic
    if (validatedData.seedBatchId) {
      const { seedBatches } = await import('@/lib/db/schema')

      // Get the seed batch
      const [seedBatch] = await db
        .select()
        .from(seedBatches)
        .where(
          and(
            eq(seedBatches.id, validatedData.seedBatchId),
            eq(seedBatches.userId, session.user.id)
          )
        )

      if (!seedBatch) {
        return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
      }

      // Validate sufficient quantity
      const quantityToPlant = parseFloat(validatedData.quantityPlanted)
      const available = parseFloat(seedBatch.currentQuantity)

      if (quantityToPlant > available) {
        return NextResponse.json(
          {
            error: 'Insufficient seeds',
            message: `You have ${available} ${seedBatch.quantityUnit} available but tried to plant ${quantityToPlant}.`,
            available: available,
            requested: quantityToPlant,
          },
          { status: 400 }
        )
      }

      // Deduct quantity from seed batch
      const newQuantity = (available - quantityToPlant).toFixed(2)
      await db
        .update(seedBatches)
        .set({
          currentQuantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(seedBatches.id, validatedData.seedBatchId))
    }

    // Stock validation and deduction for purchased seedlings
    if (validatedData.purchasedSeedlingId) {
      const { purchasedSeedlings } = await import('@/lib/db/schema')

      // Get the seedling purchase
      const [seedling] = await db
        .select()
        .from(purchasedSeedlings)
        .where(
          and(
            eq(purchasedSeedlings.id, validatedData.purchasedSeedlingId),
            eq(purchasedSeedlings.userId, session.user.id)
          )
        )

      if (!seedling) {
        return NextResponse.json({ error: 'Purchased seedling not found' }, { status: 404 })
      }

      // Validate sufficient quantity
      const quantityToPlant = parseFloat(validatedData.quantityPlanted)
      const available = parseFloat(seedling.currentQuantity)

      if (quantityToPlant > available) {
        return NextResponse.json(
          {
            error: 'Insufficient seedlings',
            message: `You have ${available} seedlings available but tried to plant ${quantityToPlant}.`,
            available: available,
            requested: quantityToPlant,
          },
          { status: 400 }
        )
      }

      // Deduct quantity from purchased seedlings
      const newQuantity = (available - quantityToPlant).toFixed(2)
      await db
        .update(purchasedSeedlings)
        .set({
          currentQuantity: newQuantity,
          updatedAt: new Date(),
        })
        .where(eq(purchasedSeedlings.id, validatedData.purchasedSeedlingId))
    }

    // Create the planting log
    const [newPlanting] = await db
      .insert(plantingLogs)
      .values({
        userId: session.user.id,
        cropId: validatedData.cropId,
        plotId: validatedData.plotId || null,
        plantingDate: validatedData.plantingDate,
        quantityPlanted: validatedData.quantityPlanted,
        quantityUnit: validatedData.quantityUnit,
        expectedHarvestDate: validatedData.expectedHarvestDate || null,
        seedBatchId: validatedData.seedBatchId || null,
        purchasedSeedlingId: validatedData.purchasedSeedlingId || null,
        status: 'active',
        notes: validatedData.notes || null,
      })
      .returning()

    return NextResponse.json(newPlanting, { status: 201 })
  } catch (error) {
    console.error('Error creating planting log:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create planting log' }, { status: 500 })
  }
}

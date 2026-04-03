import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { harvestLogs, plantingLogs, crops } from '@/lib/db/schema'
import { harvestLogSchema } from '@/lib/schemas/planting-schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/harvest-logs - Fetch all harvest logs for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userHarvests = await db
      .select({
        id: harvestLogs.id,
        plantingLogId: harvestLogs.plantingLogId,
        cropName: crops.name,
        cropVariety: crops.variety,
        harvestDate: harvestLogs.harvestDate,
        quantityHarvested: harvestLogs.quantityHarvested,
        quantityUnit: harvestLogs.quantityUnit,
        currentStock: harvestLogs.currentStock,
        qualityGrade: harvestLogs.qualityGrade,
        notes: harvestLogs.notes,
        createdAt: harvestLogs.createdAt,
        updatedAt: harvestLogs.updatedAt,
      })
      .from(harvestLogs)
      .leftJoin(plantingLogs, eq(harvestLogs.plantingLogId, plantingLogs.id))
      .leftJoin(crops, eq(plantingLogs.cropId, crops.id))
      .where(and(eq(harvestLogs.userId, session.user.id), isNull(harvestLogs.deletedAt)))
      .orderBy(desc(harvestLogs.harvestDate))

    return NextResponse.json(userHarvests)
  } catch (error) {
    console.error('Error fetching harvest logs:', error)
    return NextResponse.json({ error: 'Failed to fetch harvest logs' }, { status: 500 })
  }
}

// POST /api/harvest-logs - Create a new harvest log
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = harvestLogSchema.parse(body)

    // If currentStock not provided, default to quantityHarvested
    const currentStock = validatedData.currentStock || validatedData.quantityHarvested

    const [newHarvest] = await db
      .insert(harvestLogs)
      .values({
        userId: session.user.id,
        plantingLogId: validatedData.plantingLogId,
        harvestDate: validatedData.harvestDate,
        quantityHarvested: validatedData.quantityHarvested,
        quantityUnit: validatedData.quantityUnit,
        currentStock: currentStock,
        qualityGrade: validatedData.qualityGrade || null,
        notes: validatedData.notes || null,
      })
      .returning()

    // Update planting log status to 'harvested'
    await db
      .update(plantingLogs)
      .set({
        status: 'harvested',
        actualHarvestDate: validatedData.harvestDate,
        updatedAt: new Date(),
      })
      .where(eq(plantingLogs.id, validatedData.plantingLogId))

    return NextResponse.json(newHarvest, { status: 201 })
  } catch (error) {
    console.error('Error creating harvest log:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create harvest log' }, { status: 500 })
  }
}

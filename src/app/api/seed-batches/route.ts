import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { seedBatches, crops, suppliers } from '@/lib/db/schema'
import { seedBatchSchema } from '@/lib/schemas/planting-schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/seed-batches - Fetch all seed batches for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userBatches = await db
      .select({
        id: seedBatches.id,
        cropId: seedBatches.cropId,
        cropName: crops.name,
        cropVariety: crops.variety,
        supplierId: seedBatches.supplierId,
        supplierName: suppliers.name,
        batchCode: seedBatches.batchCode,
        purchaseDate: seedBatches.purchaseDate,
        initialQuantity: seedBatches.initialQuantity,
        currentQuantity: seedBatches.currentQuantity,
        quantityUnit: seedBatches.quantityUnit,
        costPerUnit: seedBatches.costPerUnit,
        totalCost: seedBatches.totalCost,
        organicCertified: seedBatches.organicCertified,
        notes: seedBatches.notes,
        createdAt: seedBatches.createdAt,
        updatedAt: seedBatches.updatedAt,
      })
      .from(seedBatches)
      .leftJoin(crops, eq(seedBatches.cropId, crops.id))
      .leftJoin(suppliers, eq(seedBatches.supplierId, suppliers.id))
      .where(and(eq(seedBatches.userId, session.user.id), isNull(seedBatches.deletedAt)))
      .orderBy(desc(seedBatches.createdAt))

    return NextResponse.json(userBatches)
  } catch (error) {
    console.error('Error fetching seed batches:', error)
    return NextResponse.json({ error: 'Failed to fetch seed batches' }, { status: 500 })
  }
}

// POST /api/seed-batches - Create a new seed batch
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = seedBatchSchema.parse(body)

    // Calculate total cost if cost per unit provided
    const initialQty = parseFloat(validatedData.initialQuantity)
    const costPerUnit = validatedData.costPerUnit ? parseFloat(validatedData.costPerUnit) : null
    const totalCost = costPerUnit ? (initialQty * costPerUnit).toFixed(2) : null

    const [newBatch] = await db
      .insert(seedBatches)
      .values({
        userId: session.user.id,
        cropId: validatedData.cropId,
        supplierId: validatedData.supplierId || null,
        batchCode: validatedData.batchCode,
        purchaseDate: validatedData.purchaseDate || null,
        initialQuantity: validatedData.initialQuantity,
        currentQuantity: validatedData.initialQuantity, // Start with full quantity
        quantityUnit: validatedData.quantityUnit,
        costPerUnit: validatedData.costPerUnit || null,
        totalCost: totalCost,
        organicCertified: validatedData.organicStatus || null,
        notes: validatedData.notes || null,
      })
      .returning()

    return NextResponse.json(newBatch, { status: 201 })
  } catch (error) {
    console.error('Error creating seed batch:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    // Check for unique constraint violation (duplicate batch code)
    if ((error as any).code === '23505') {
      return NextResponse.json({ error: 'Batch code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create seed batch' }, { status: 500 })
  }
}

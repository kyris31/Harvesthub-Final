import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { purchasedSeedlings, crops, suppliers } from '@/lib/db/schema'
import { purchasedSeedlingSchema } from '@/lib/schemas/planting-schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/purchased-seedlings - Fetch all purchased seedlings
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userSeedlings = await db
      .select({
        id: purchasedSeedlings.id,
        cropId: purchasedSeedlings.cropId,
        cropName: crops.name,
        cropVariety: crops.variety,
        supplierId: purchasedSeedlings.supplierId,
        supplierName: suppliers.name,
        purchaseDate: purchasedSeedlings.purchaseDate,
        quantityPurchased: purchasedSeedlings.quantityPurchased,
        currentQuantity: purchasedSeedlings.currentQuantity,
        costPerSeedling: purchasedSeedlings.costPerSeedling,
        totalCost: purchasedSeedlings.totalCost,
        notes: purchasedSeedlings.notes,
        createdAt: purchasedSeedlings.createdAt,
      })
      .from(purchasedSeedlings)
      .leftJoin(crops, eq(purchasedSeedlings.cropId, crops.id))
      .leftJoin(suppliers, eq(purchasedSeedlings.supplierId, suppliers.id))
      .where(
        and(eq(purchasedSeedlings.userId, session.user.id), isNull(purchasedSeedlings.deletedAt))
      )
      .orderBy(desc(purchasedSeedlings.createdAt))

    return NextResponse.json(userSeedlings)
  } catch (error) {
    console.error('Error fetching purchased seedlings:', error)
    return NextResponse.json({ error: 'Failed to fetch purchased seedlings' }, { status: 500 })
  }
}

// POST /api/purchased-seedlings - Create new seedling purchase
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = purchasedSeedlingSchema.parse(body)

    const qty = parseFloat(validatedData.quantityPurchased)
    const costPer = validatedData.costPerSeedling ? parseFloat(validatedData.costPerSeedling) : null
    const totalCost = costPer ? (qty * costPer).toFixed(2) : null

    const [newSeedling] = await db
      .insert(purchasedSeedlings)
      .values({
        userId: session.user.id,
        cropId: validatedData.cropId,
        supplierId: validatedData.supplierId || null,
        purchaseDate: validatedData.purchaseDate || null,
        quantityPurchased: validatedData.quantityPurchased,
        currentQuantity: validatedData.quantityPurchased,
        costPerSeedling: validatedData.costPerSeedling || null,
        totalCost: totalCost,
        notes: validatedData.notes || null,
      })
      .returning()

    return NextResponse.json(newSeedling, { status: 201 })
  } catch (error) {
    console.error('Error creating purchased seedling:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create purchased seedling' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { seedlingProductionLogs, seedBatches, plantingLogs } from '@/lib/db/schema'
import { eq, and, isNull, desc, gt, or, sql } from 'drizzle-orm'
import { z } from 'zod'

const createSchema = z.object({
  seedBatchId: z.string().uuid(),
  cropId: z.string().uuid(),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantitySown: z.string().min(1),
  sowingUnit: z.string().min(1),
  nurseryLocation: z.string().optional().or(z.literal('')),
  expectedSeedlings: z.number().int().optional().nullable(),
  actualSeedlingsProduced: z.number().int().default(0),
  notes: z.string().optional().or(z.literal('')),
})

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await db.query.seedlingProductionLogs.findMany({
    where: and(
      eq(seedlingProductionLogs.userId, session.user.id),
      isNull(seedlingProductionLogs.deletedAt),
      // Hide only when stock=0 AND an explicit non-active (completed/harvested) planting is linked
      // Records with no planting link stay visible always
      or(
        gt(seedlingProductionLogs.currentSeedlingsAvailable, 0),
        eq(seedlingProductionLogs.actualSeedlingsProduced, 0),
        sql`NOT EXISTS (
          SELECT 1 FROM planting_logs pl
          WHERE pl.self_produced_seedling_id = ${seedlingProductionLogs.id}
            AND pl.status NOT IN ('active')
            AND pl.deleted_at IS NULL
        )`
      )
    ),
    with: {
      crop: { columns: { name: true, variety: true } },
      seedBatch: { columns: { batchCode: true } },
    },
    orderBy: [desc(seedlingProductionLogs.sowingDate)],
  })

  return NextResponse.json(records)
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    // Validate and deduct from seed batch
    const [seedBatch] = await db
      .select()
      .from(seedBatches)
      .where(
        and(
          eq(seedBatches.id, data.seedBatchId),
          eq(seedBatches.userId, session.user.id),
          isNull(seedBatches.deletedAt)
        )
      )

    if (!seedBatch) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    const quantityToSow = parseFloat(data.quantitySown)
    const available = parseFloat(seedBatch.currentQuantity)

    if (quantityToSow > available) {
      return NextResponse.json(
        {
          error: 'Insufficient seeds',
          message: `You have ${available} ${seedBatch.quantityUnit} available but tried to sow ${quantityToSow}.`,
        },
        { status: 400 }
      )
    }

    const newQuantity = (available - quantityToSow).toFixed(2)
    await db
      .update(seedBatches)
      .set({ currentQuantity: newQuantity, updatedAt: new Date() })
      .where(eq(seedBatches.id, data.seedBatchId))

    const actualProduced = data.actualSeedlingsProduced ?? 0

    const [record] = await db
      .insert(seedlingProductionLogs)
      .values({
        userId: session.user.id,
        seedBatchId: data.seedBatchId,
        cropId: data.cropId,
        sowingDate: data.sowingDate,
        quantitySown: data.quantitySown,
        sowingUnit: data.sowingUnit,
        nurseryLocation: data.nurseryLocation || null,
        expectedSeedlings: data.expectedSeedlings ?? null,
        actualSeedlingsProduced: actualProduced,
        currentSeedlingsAvailable: actualProduced,
        notes: data.notes || null,
      })
      .returning()

    return NextResponse.json(record, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error creating sowing record:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { seedlingProductionLogs, seedBatches } from '@/lib/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
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
      isNull(seedlingProductionLogs.deletedAt)
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

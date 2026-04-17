import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { seedlingProductionLogs, seedBatches, plantingLogs } from '@/lib/db/schema'
import { eq, and, isNull, sum } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  actualSeedlingsProduced: z.number().int().min(0),
  nurseryLocation: z.string().optional().or(z.literal('')),
  readyForTransplantDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    // Calculate how many have already been planted from this seedling batch
    const [plantedResult] = await db
      .select({ total: sum(plantingLogs.quantityPlanted) })
      .from(plantingLogs)
      .where(and(eq(plantingLogs.selfProducedSeedlingId, id), isNull(plantingLogs.deletedAt)))
    const totalPlanted = Math.round(parseFloat(plantedResult?.total ?? '0') || 0)
    const newAvailable = Math.max(0, data.actualSeedlingsProduced - totalPlanted)

    const [updated] = await db
      .update(seedlingProductionLogs)
      .set({
        sowingDate: data.sowingDate,
        actualSeedlingsProduced: data.actualSeedlingsProduced,
        currentSeedlingsAvailable: newAvailable,
        nurseryLocation: data.nurseryLocation || null,
        readyForTransplantDate: data.readyForTransplantDate || null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(seedlingProductionLogs.id, id), eq(seedlingProductionLogs.userId, session.user.id))
      )
      .returning()

    if (!updated) return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Error updating sowing record:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the log first to restore seed batch quantity
  const [log] = await db
    .select()
    .from(seedlingProductionLogs)
    .where(
      and(
        eq(seedlingProductionLogs.id, id),
        eq(seedlingProductionLogs.userId, session.user.id),
        isNull(seedlingProductionLogs.deletedAt)
      )
    )

  if (!log) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  // Soft-delete the log
  await db
    .update(seedlingProductionLogs)
    .set({ deletedAt: new Date() })
    .where(eq(seedlingProductionLogs.id, id))

  // Restore the seed batch quantity
  const [batch] = await db
    .select()
    .from(seedBatches)
    .where(and(eq(seedBatches.id, log.seedBatchId), isNull(seedBatches.deletedAt)))

  if (batch) {
    const restored = (parseFloat(batch.currentQuantity) + parseFloat(log.quantitySown)).toFixed(2)
    await db
      .update(seedBatches)
      .set({ currentQuantity: restored, updatedAt: new Date() })
      .where(eq(seedBatches.id, log.seedBatchId))
  }

  return NextResponse.json({ success: true })
}

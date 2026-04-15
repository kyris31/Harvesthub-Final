import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { seedlingProductionLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  actualSeedlingsProduced: z.number().int().min(0),
  currentSeedlingsAvailable: z.number().int().min(0),
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

    const [updated] = await db
      .update(seedlingProductionLogs)
      .set({
        sowingDate: data.sowingDate,
        actualSeedlingsProduced: data.actualSeedlingsProduced,
        currentSeedlingsAvailable: Math.min(
          data.currentSeedlingsAvailable,
          data.actualSeedlingsProduced
        ),
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

  await db
    .update(seedlingProductionLogs)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(seedlingProductionLogs.id, id), eq(seedlingProductionLogs.userId, session.user.id))
    )

  return NextResponse.json({ success: true })
}

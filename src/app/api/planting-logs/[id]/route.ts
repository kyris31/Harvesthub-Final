import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { plantingLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// PATCH /api/planting-logs/[id] - Update a planting log
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if planting exists and belongs to user
    const [existingPlanting] = await db
      .select()
      .from(plantingLogs)
      .where(and(eq(plantingLogs.id, id), eq(plantingLogs.userId, session.user.id)))

    if (!existingPlanting) {
      return NextResponse.json({ error: 'Planting log not found' }, { status: 404 })
    }

    const [updatedPlanting] = await db
      .update(plantingLogs)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(plantingLogs.id, id))
      .returning()

    return NextResponse.json(updatedPlanting)
  } catch (error) {
    console.error('Error updating planting log:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update planting log' }, { status: 500 })
  }
}

// DELETE /api/planting-logs/[id] - Soft delete a planting log
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if planting exists and belongs to user
    const [existingPlanting] = await db
      .select()
      .from(plantingLogs)
      .where(and(eq(plantingLogs.id, id), eq(plantingLogs.userId, session.user.id)))

    if (!existingPlanting) {
      return NextResponse.json({ error: 'Planting log not found' }, { status: 404 })
    }

    // Soft delete
    await db.update(plantingLogs).set({ deletedAt: new Date() }).where(eq(plantingLogs.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting planting log:', error)
    return NextResponse.json({ error: 'Failed to delete planting log' }, { status: 500 })
  }
}

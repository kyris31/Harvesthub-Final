import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { harvestLogs } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// PATCH /api/harvest-logs/[id] - Update a harvest log
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

    // Check if harvest exists and belongs to user
    const [existingHarvest] = await db
      .select()
      .from(harvestLogs)
      .where(and(eq(harvestLogs.id, id), eq(harvestLogs.userId, session.user.id)))

    if (!existingHarvest) {
      return NextResponse.json({ error: 'Harvest log not found' }, { status: 404 })
    }

    const [updatedHarvest] = await db
      .update(harvestLogs)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(harvestLogs.id, id))
      .returning()

    return NextResponse.json(updatedHarvest)
  } catch (error) {
    console.error('Error updating harvest log:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update harvest log' }, { status: 500 })
  }
}

// DELETE /api/harvest-logs/[id] - Soft delete a harvest log
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

    // Check if harvest exists and belongs to user
    const [existingHarvest] = await db
      .select()
      .from(harvestLogs)
      .where(and(eq(harvestLogs.id, id), eq(harvestLogs.userId, session.user.id)))

    if (!existingHarvest) {
      return NextResponse.json({ error: 'Harvest log not found' }, { status: 404 })
    }

    // Soft delete
    await db.update(harvestLogs).set({ deletedAt: new Date() }).where(eq(harvestLogs.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting harvest log:', error)
    return NextResponse.json({ error: 'Failed to delete harvest log' }, { status: 500 })
  }
}

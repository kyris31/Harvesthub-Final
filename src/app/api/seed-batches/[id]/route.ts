import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { seedBatches } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// PATCH /api/seed-batches/[id] - Update a seed batch
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

    // Check if batch exists and belongs to user
    const [existingBatch] = await db
      .select()
      .from(seedBatches)
      .where(and(eq(seedBatches.id, id), eq(seedBatches.userId, session.user.id)))

    if (!existingBatch) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    // Validate quantity consistency before update
    const newInitial =
      body.initialQuantity !== undefined
        ? parseFloat(body.initialQuantity)
        : parseFloat(existingBatch.initialQuantity)
    const newCurrent =
      body.currentQuantity !== undefined
        ? parseFloat(body.currentQuantity)
        : parseFloat(existingBatch.currentQuantity)

    if (newCurrent < 0) {
      return NextResponse.json({ error: 'Current quantity cannot be negative.' }, { status: 400 })
    }
    if (newCurrent > newInitial) {
      return NextResponse.json(
        { error: 'Current quantity cannot exceed initial quantity.' },
        { status: 400 }
      )
    }

    // Recalculate total cost if quantities or cost changed
    let updates = { ...body, updatedAt: new Date() }
    if (body.initialQuantity || body.costPerUnit) {
      const initialQty = parseFloat(body.initialQuantity || existingBatch.initialQuantity)
      const costPerUnit = parseFloat(body.costPerUnit || existingBatch.costPerUnit || '0')
      if (costPerUnit > 0) {
        updates.totalCost = (initialQty * costPerUnit).toFixed(2)
      }
    }

    const [updatedBatch] = await db
      .update(seedBatches)
      .set(updates)
      .where(eq(seedBatches.id, id))
      .returning()

    return NextResponse.json(updatedBatch)
  } catch (error) {
    console.error('Error updating seed batch:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update seed batch' }, { status: 500 })
  }
}

// DELETE /api/seed-batches/[id] - Soft delete a seed batch
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

    // Check if batch exists and belongs to user
    const [existingBatch] = await db
      .select()
      .from(seedBatches)
      .where(and(eq(seedBatches.id, id), eq(seedBatches.userId, session.user.id)))

    if (!existingBatch) {
      return NextResponse.json({ error: 'Seed batch not found' }, { status: 404 })
    }

    // Soft delete
    await db.update(seedBatches).set({ deletedAt: new Date() }).where(eq(seedBatches.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting seed batch:', error)
    return NextResponse.json({ error: 'Failed to delete seed batch' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { crops } from '@/lib/db/schema'
import { cropSchema } from '@/lib/schemas/crop-schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

// PATCH /api/crops/[id] - Update a crop
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
    const validatedData = cropSchema.parse(body)

    // Check if crop exists and belongs to user
    const [existingCrop] = await db
      .select()
      .from(crops)
      .where(and(eq(crops.id, id), eq(crops.userId, session.user.id)))

    if (!existingCrop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    const [updatedCrop] = await db
      .update(crops)
      .set({
        name: validatedData.name,
        variety: validatedData.variety || null,
        category: validatedData.category,
        description: validatedData.description || null,
        updatedAt: new Date(),
      })
      .where(eq(crops.id, id))
      .returning()

    return NextResponse.json(updatedCrop)
  } catch (error) {
    console.error('Error updating crop:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update crop' }, { status: 500 })
  }
}

// DELETE /api/crops/[id] - Soft delete a crop
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

    // Check if crop exists and belongs to user
    const [existingCrop] = await db
      .select()
      .from(crops)
      .where(and(eq(crops.id, id), eq(crops.userId, session.user.id)))

    if (!existingCrop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    // Soft delete
    await db.update(crops).set({ deletedAt: new Date() }).where(eq(crops.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting crop:', error)
    return NextResponse.json({ error: 'Failed to delete crop' }, { status: 500 })
  }
}

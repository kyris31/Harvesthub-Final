import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { plots } from '@/lib/db/schema'
import { plotSchema } from '@/lib/schemas/planting-schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/plots - Fetch all plots for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPlots = await db
      .select()
      .from(plots)
      .where(and(eq(plots.userId, session.user.id), isNull(plots.deletedAt)))
      .orderBy(desc(plots.createdAt))

    return NextResponse.json(userPlots)
  } catch (error) {
    console.error('Error fetching plots:', error)
    return NextResponse.json({ error: 'Failed to fetch plots' }, { status: 500 })
  }
}

// POST /api/plots - Create a new plot
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = plotSchema.parse(body)

    const [newPlot] = await db
      .insert(plots)
      .values({
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description || null,
        areaSqm: validatedData.areaSqm || null,
        status: validatedData.status,
      })
      .returning()

    return NextResponse.json(newPlot, { status: 201 })
  } catch (error) {
    console.error('Error creating plot:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create plot' }, { status: 500 })
  }
}

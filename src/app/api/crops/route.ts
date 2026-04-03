import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { crops } from '@/lib/db/schema'
import { cropSchema } from '@/lib/schemas/crop-schema'
import { eq, and, isNull, desc, asc } from 'drizzle-orm'
import { z } from 'zod'

// GET /api/crops - Fetch all crops for the current user with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where conditions
    const conditions = [eq(crops.userId, session.user.id), isNull(crops.deletedAt)]

    // Add category filter if not 'all'
    if (category !== 'all') {
      conditions.push(eq(crops.category, category))
    }

    // Build query with sorting
    const sortColumn = sortBy === 'name' ? crops.name : crops.createdAt
    const orderByFn = sortOrder === 'desc' ? desc : asc

    const allCrops = await db
      .select()
      .from(crops)
      .where(and(...conditions))
      .orderBy(orderByFn(sortColumn))

    // Apply search filter (client-side for now, can be optimized with SQL LIKE)
    let filteredCrops = allCrops
    if (search) {
      const searchLower = search.toLowerCase()
      filteredCrops = allCrops.filter(
        (crop: any) =>
          crop.name.toLowerCase().includes(searchLower) ||
          crop.variety?.toLowerCase().includes(searchLower)
      )
    }

    // Calculate pagination
    const total = filteredCrops.length
    const totalPages = Math.ceil(total / limit)
    const offset = (page - 1) * limit
    const paginatedCrops = filteredCrops.slice(offset, offset + limit)

    return NextResponse.json({
      crops: paginatedCrops,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching crops:', error)
    return NextResponse.json({ error: 'Failed to fetch crops' }, { status: 500 })
  }
}

// POST /api/crops - Create a new crop
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = cropSchema.parse(body)

    const [newCrop] = await db
      .insert(crops)
      .values({
        userId: session.user.id,
        name: validatedData.name,
        variety: validatedData.variety || null,
        category: validatedData.category,
        description: validatedData.description || null,
      })
      .returning()

    return NextResponse.json(newCrop, { status: 201 })
  } catch (error) {
    console.error('Error creating crop:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create crop' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { suppliers } from '@/lib/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { z } from 'zod'

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/suppliers - Fetch all suppliers for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userSuppliers = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.userId, session.user.id), isNull(suppliers.deletedAt)))
      .orderBy(desc(suppliers.createdAt))

    return NextResponse.json(userSuppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = supplierSchema.parse(body)

    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        userId: session.user.id,
        name: validatedData.name,
        contactPerson: validatedData.contactPerson || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        notes: validatedData.notes || null,
      })
      .returning()

    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}

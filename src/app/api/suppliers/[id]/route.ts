import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { db } from '@/lib/db'
import { suppliers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: supplierId } = await params

    // Soft delete - set deletedAt timestamp
    await db
      .update(suppliers)
      .set({ deletedAt: new Date() })
      .where(and(eq(suppliers.id, supplierId), eq(suppliers.userId, session.user.id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { seedBatches, seedlingProductionLogs, plantingLogs } from '@/lib/db/schema'
import { eq, and, isNull, sum } from 'drizzle-orm'

// POST /api/seed-batches/recalculate
// Recalculates currentQuantity for every seed batch owned by the user,
// starting from initialQuantity and subtracting:
//   - quantity_sown from active seedling production logs
//   - quantity_planted from active direct-sow planting logs
export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Fetch all active seed batches for the user
  const batches = await db
    .select()
    .from(seedBatches)
    .where(and(eq(seedBatches.userId, userId), isNull(seedBatches.deletedAt)))

  let updated = 0

  for (const batch of batches) {
    // Sum seeds sown in seedling production logs
    const [sownResult] = await db
      .select({ total: sum(seedlingProductionLogs.quantitySown) })
      .from(seedlingProductionLogs)
      .where(
        and(
          eq(seedlingProductionLogs.seedBatchId, batch.id),
          isNull(seedlingProductionLogs.deletedAt)
        )
      )

    // Sum seeds used in direct-sow planting logs
    const [plantedResult] = await db
      .select({ total: sum(plantingLogs.quantityPlanted) })
      .from(plantingLogs)
      .where(
        and(
          eq(plantingLogs.seedBatchId, batch.id),
          eq(plantingLogs.plantingSource, 'direct_sow'),
          isNull(plantingLogs.deletedAt)
        )
      )

    const totalSown = parseFloat(sownResult?.total ?? '0') || 0
    const totalPlanted = parseFloat(plantedResult?.total ?? '0') || 0
    const initial = parseFloat(batch.initialQuantity)
    const correct = Math.max(0, initial - totalSown - totalPlanted).toFixed(2)

    if (correct !== batch.currentQuantity) {
      await db
        .update(seedBatches)
        .set({ currentQuantity: correct, updatedAt: new Date() })
        .where(eq(seedBatches.id, batch.id))
      updated++
    }
  }

  return NextResponse.json({ success: true, batchesUpdated: updated })
}

'use server'

import { db } from '@/lib/db'
import { trees } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) throw new Error('Not authenticated')
  return session.user.id
}

// ── List all trees ────────────────────────────────────────────────────────────
export async function getTrees() {
  const userId = await getUserId()
  return db
    .select()
    .from(trees)
    .where(and(eq(trees.userId, userId), isNull(trees.deletedAt)))
    .orderBy(desc(trees.createdAt))
}

// ── Get single tree ───────────────────────────────────────────────────────────
export async function getTree(id: string) {
  const userId = await getUserId()
  const [tree] = await db
    .select()
    .from(trees)
    .where(and(eq(trees.id, id), eq(trees.userId, userId), isNull(trees.deletedAt)))
  if (!tree) throw new Error('Tree not found')
  return tree
}

// ── Create tree ───────────────────────────────────────────────────────────────
export async function createTree(data: {
  identifier: string
  species: string
  variety?: string
  plantingDate?: string
  plotId?: string
  locationDescription?: string
  status?: string
  healthNotes?: string
  estimatedAnnualYield?: number
  yieldUnit?: string
  notes?: string
}) {
  const userId = await getUserId()
  const [tree] = await db
    .insert(trees)
    .values({
      userId,
      identifier: data.identifier,
      species: data.species,
      variety: data.variety || null,
      plantingDate: data.plantingDate || null,
      plotId: data.plotId || null,
      locationDescription: data.locationDescription || null,
      status: data.status || 'healthy',
      healthNotes: data.healthNotes || null,
      estimatedAnnualYield: data.estimatedAnnualYield?.toString() || null,
      yieldUnit: data.yieldUnit || null,
      notes: data.notes || null,
    })
    .returning()
  revalidatePath('/dashboard/trees')
  return tree
}

// ── Update tree ───────────────────────────────────────────────────────────────
export async function updateTree(
  id: string,
  data: {
    identifier?: string
    species?: string
    variety?: string
    plantingDate?: string
    plotId?: string | null
    locationDescription?: string
    status?: string
    healthNotes?: string
    lastHarvestDate?: string
    estimatedAnnualYield?: number
    yieldUnit?: string
    notes?: string
  }
) {
  const userId = await getUserId()
  await db
    .update(trees)
    .set({
      ...data,
      plotId: data.plotId !== undefined ? data.plotId : undefined,
      estimatedAnnualYield:
        data.estimatedAnnualYield != null ? data.estimatedAnnualYield.toString() : undefined,
      lastHarvestDate: data.lastHarvestDate || null,
      updatedAt: new Date(),
    })
    .where(and(eq(trees.id, id), eq(trees.userId, userId)))
  revalidatePath('/dashboard/trees')
  revalidatePath(`/dashboard/trees/${id}`)
}

// ── Delete (soft) tree ────────────────────────────────────────────────────────
export async function deleteTree(id: string) {
  const userId = await getUserId()
  await db
    .update(trees)
    .set({ deletedAt: new Date() })
    .where(and(eq(trees.id, id), eq(trees.userId, userId)))
  revalidatePath('/dashboard/trees')
}

'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { crops, plantingLogs } from '@/lib/db/schema'
import { and, eq, isNull, desc, asc, or, ilike } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { cropSchema, type CropFormData } from '@/lib/validations/crops'

export async function getCrops(options?: {
  search?: string
  category?: string
  sortBy?: string
  sortOrder?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const { search, category, sortBy = 'name', sortOrder = 'asc' } = options ?? {}

  const whereConditions = [eq(crops.userId, session.user.id), isNull(crops.deletedAt)]

  if (search) {
    whereConditions.push(or(ilike(crops.name, `%${search}%`), ilike(crops.variety, `%${search}%`))!)
  }

  if (category && category !== 'all') {
    whereConditions.push(eq(crops.category, category as any))
  }

  const sortColumn = sortBy === 'name' ? crops.name : crops.createdAt
  const orderBy = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)

  return await db.query.crops.findMany({
    where: and(...whereConditions),
    orderBy: [orderBy],
  })
}

export async function getCrop(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const crop = await db.query.crops.findFirst({
    where: and(eq(crops.id, id), eq(crops.userId, session.user.id), isNull(crops.deletedAt)),
  })

  if (!crop) {
    throw new Error('Crop not found')
  }

  return crop
}

export async function createCrop(data: CropFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = cropSchema.parse(data)

  const [crop] = await db
    .insert(crops)
    .values({
      ...validated,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/crops')
  return crop
}

export async function updateCrop(id: string, data: CropFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = cropSchema.parse(data)

  // Verify ownership
  const existing = await db.query.crops.findFirst({
    where: and(eq(crops.id, id), eq(crops.userId, session.user.id), isNull(crops.deletedAt)),
  })

  if (!existing) {
    throw new Error('Crop not found')
  }

  const [updated] = await db
    .update(crops)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(eq(crops.id, id))
    .returning()

  revalidatePath('/dashboard/crops')
  revalidatePath(`/dashboard/crops/${id}`)
  return updated
}

export async function deleteCrop(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.crops.findFirst({
    where: and(eq(crops.id, id), eq(crops.userId, session.user.id), isNull(crops.deletedAt)),
  })

  if (!existing) {
    throw new Error('Crop not found')
  }

  // Check for dependencies
  const hasPlantings = await db.query.plantingLogs.findFirst({
    where: and(eq(plantingLogs.cropId, id), isNull(plantingLogs.deletedAt)),
  })

  if (hasPlantings) {
    throw new Error(
      'Cannot delete crop with active plantings. Please delete or archive plantings first.'
    )
  }

  // Soft delete
  await db.update(crops).set({ deletedAt: new Date() }).where(eq(crops.id, id))

  revalidatePath('/dashboard/crops')
}

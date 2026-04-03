'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { cultivationActivities, inputInventory } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import {
  cultivationActivitySchema,
  type CultivationActivityFormData,
} from '@/lib/validations/cultivation'

export async function getCultivationActivities(filters?: {
  plantingLogId?: string
  activityType?: string
  startDate?: string
  endDate?: string
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [
    eq(cultivationActivities.userId, session.user.id),
    isNull(cultivationActivities.deletedAt),
  ]

  if (filters?.plantingLogId) {
    whereConditions.push(eq(cultivationActivities.plantingLogId, filters.plantingLogId))
  }

  if (filters?.activityType) {
    whereConditions.push(eq(cultivationActivities.activityType, filters.activityType))
  }

  if (filters?.startDate) {
    whereConditions.push(gte(cultivationActivities.activityDate, filters.startDate))
  }

  if (filters?.endDate) {
    whereConditions.push(lte(cultivationActivities.activityDate, filters.endDate))
  }

  return await db.query.cultivationActivities.findMany({
    where: and(...whereConditions),
    orderBy: [desc(cultivationActivities.activityDate)],
    with: {
      plantingLog: {
        with: {
          crop: true,
          plot: true,
        },
      },
      inputInventory: true,
    },
  })
}

export async function getCultivationActivity(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const activity = await db.query.cultivationActivities.findFirst({
    where: and(
      eq(cultivationActivities.id, id),
      eq(cultivationActivities.userId, session.user.id),
      isNull(cultivationActivities.deletedAt)
    ),
    with: {
      plantingLog: {
        with: {
          crop: true,
          plot: true,
        },
      },
      inputInventory: true,
    },
  })

  if (!activity) {
    throw new Error('Activity not found')
  }

  return activity
}

export async function createCultivationActivity(data: CultivationActivityFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = cultivationActivitySchema.parse(data)

  // Validate inventory quantity if input is being used
  if (validated.inputInventoryId && validated.quantityUsed) {
    const input = await db.query.inputInventory.findFirst({
      where: and(
        eq(inputInventory.id, validated.inputInventoryId),
        eq(inputInventory.userId, session.user.id),
        isNull(inputInventory.deletedAt)
      ),
    })

    if (!input) {
      throw new Error('Input inventory item not found')
    }

    const requestedQuantity = Number(validated.quantityUsed)
    const availableQuantity = Number(input.currentQuantity || 0)

    if (requestedQuantity > availableQuantity) {
      throw new Error(
        `Insufficient inventory. You are trying to use ${requestedQuantity} ${validated.quantityUnit || input.quantityUnit} but only ${availableQuantity} ${input.quantityUnit} is available.`
      )
    }

    // Deduct the quantity from inventory
    await db
      .update(inputInventory)
      .set({
        currentQuantity: String(availableQuantity - requestedQuantity),
        updatedAt: new Date(),
      })
      .where(eq(inputInventory.id, validated.inputInventoryId))
  }

  const [activity] = await db
    .insert(cultivationActivities)
    .values({
      ...validated,
      plantingLogId: validated.plantingLogId || null,
      inputInventoryId: validated.inputInventoryId || null,
      quantityUsed: validated.quantityUsed || null,
      quantityUnit: validated.quantityUnit || null,
      cost: validated.cost || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/cultivation')
  revalidatePath('/dashboard/inventory')
  return activity
}

export async function updateCultivationActivity(id: string, data: CultivationActivityFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = cultivationActivitySchema.parse(data)

  // Verify ownership
  const existing = await db.query.cultivationActivities.findFirst({
    where: and(
      eq(cultivationActivities.id, id),
      eq(cultivationActivities.userId, session.user.id),
      isNull(cultivationActivities.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Activity not found')
  }

  const [updated] = await db
    .update(cultivationActivities)
    .set({
      ...validated,
      plantingLogId: validated.plantingLogId || null,
      inputInventoryId: validated.inputInventoryId || null,
      quantityUsed: validated.quantityUsed || null,
      quantityUnit: validated.quantityUnit || null,
      cost: validated.cost || null,
      updatedAt: new Date(),
    })
    .where(eq(cultivationActivities.id, id))
    .returning()

  revalidatePath('/dashboard/cultivation')
  revalidatePath(`/dashboard/cultivation/${id}`)
  return updated
}

export async function deleteCultivationActivity(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.cultivationActivities.findFirst({
    where: and(
      eq(cultivationActivities.id, id),
      eq(cultivationActivities.userId, session.user.id),
      isNull(cultivationActivities.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Activity not found')
  }

  // Soft delete
  await db
    .update(cultivationActivities)
    .set({ deletedAt: new Date() })
    .where(eq(cultivationActivities.id, id))

  revalidatePath('/dashboard/cultivation')
}

'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import {
  cultivationActivities,
  cultivationActivityPlantings,
  cultivationActivityInputs,
  inputInventory,
} from '@/lib/db/schema'
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
      activityPlantings: {
        with: {
          plantingLog: {
            with: { crop: true, plot: true },
          },
        },
      },
      activityInputs: {
        with: { inputInventory: true },
      },
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
      activityPlantings: {
        with: {
          plantingLog: {
            with: { crop: true, plot: true },
          },
        },
      },
      activityInputs: {
        with: { inputInventory: true },
      },
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

  // Validate and deduct inventory for each input
  for (const inputItem of validated.inputs ?? []) {
    const input = await db.query.inputInventory.findFirst({
      where: and(
        eq(inputInventory.id, inputItem.inputInventoryId),
        eq(inputInventory.userId, session.user.id),
        isNull(inputInventory.deletedAt)
      ),
    })

    if (!input) {
      throw new Error('Input inventory item not found')
    }

    if (inputItem.quantityUsed) {
      const requested = Number(inputItem.quantityUsed)
      const available = Number(input.currentQuantity || 0)

      if (requested > available) {
        throw new Error(
          `Insufficient inventory for "${input.name}". Requested ${requested} ${inputItem.quantityUnit || input.quantityUnit} but only ${available} ${input.quantityUnit} available.`
        )
      }

      await db
        .update(inputInventory)
        .set({ currentQuantity: String(available - requested), updatedAt: new Date() })
        .where(eq(inputInventory.id, inputItem.inputInventoryId))
    }
  }

  const [activity] = await db
    .insert(cultivationActivities)
    .values({
      activityType: validated.activityType,
      activityDate: validated.activityDate,
      notes: validated.notes || null,
      userId: session.user.id,
    })
    .returning()

  // Insert planting associations
  if (validated.plantingLogIds && validated.plantingLogIds.length > 0) {
    await db.insert(cultivationActivityPlantings).values(
      validated.plantingLogIds.map((plantingLogId) => ({
        cultivationActivityId: activity.id,
        plantingLogId,
      }))
    )
  }

  // Insert input associations
  if (validated.inputs && validated.inputs.length > 0) {
    await db.insert(cultivationActivityInputs).values(
      validated.inputs.map((item) => ({
        cultivationActivityId: activity.id,
        inputInventoryId: item.inputInventoryId,
        quantityUsed: item.quantityUsed || null,
        quantityUnit: item.quantityUnit || null,
        cost: item.cost || null,
      }))
    )
  }

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

  await db
    .update(cultivationActivities)
    .set({
      activityType: validated.activityType,
      activityDate: validated.activityDate,
      notes: validated.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(cultivationActivities.id, id))

  // Sync planting associations
  await db
    .delete(cultivationActivityPlantings)
    .where(eq(cultivationActivityPlantings.cultivationActivityId, id))

  if (validated.plantingLogIds && validated.plantingLogIds.length > 0) {
    await db.insert(cultivationActivityPlantings).values(
      validated.plantingLogIds.map((plantingLogId) => ({
        cultivationActivityId: id,
        plantingLogId,
      }))
    )
  }

  // Sync input associations (no inventory adjustment on edit)
  await db
    .delete(cultivationActivityInputs)
    .where(eq(cultivationActivityInputs.cultivationActivityId, id))

  if (validated.inputs && validated.inputs.length > 0) {
    await db.insert(cultivationActivityInputs).values(
      validated.inputs.map((item) => ({
        cultivationActivityId: id,
        inputInventoryId: item.inputInventoryId,
        quantityUsed: item.quantityUsed || null,
        quantityUnit: item.quantityUnit || null,
        cost: item.cost || null,
      }))
    )
  }

  revalidatePath('/dashboard/cultivation')
  revalidatePath(`/dashboard/cultivation/${id}`)
  return existing
}

export async function deleteCultivationActivity(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

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

  await db
    .update(cultivationActivities)
    .set({ deletedAt: new Date() })
    .where(eq(cultivationActivities.id, id))

  revalidatePath('/dashboard/cultivation')
}

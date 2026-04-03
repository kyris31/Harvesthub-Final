'use server'

import { db } from '@/lib/db'
import { poultryFeedInventory, feedUsageRecords, flocks } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { poultryFeedSchema, feedUsageSchema } from '@/lib/validations/poultry'
import { eq, and, desc, sql, lt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Get poultry feed inventory
export async function getPoultryFeed() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const feed = await db.query.poultryFeedInventory.findMany({
    where: and(
      eq(poultryFeedInventory.userId, session.user.id),
      sql`${poultryFeedInventory.deletedAt} IS NULL`
    ),
    with: {
      supplier: true,
    },
    orderBy: [desc(poultryFeedInventory.createdAt)],
  })

  return feed
}

// Get low stock feed items
export async function getLowStockFeed(threshold: number = 20) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const lowStock = await db
    .select()
    .from(poultryFeedInventory)
    .where(
      and(
        eq(poultryFeedInventory.userId, session.user.id),
        sql`${poultryFeedInventory.deletedAt} IS NULL`,
        sql`(${poultryFeedInventory.currentQuantity} / ${poultryFeedInventory.initialQuantity} * 100) < ${threshold}`
      )
    )

  return lowStock
}

// Create feed inventory
export async function createPoultryFeed(data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = poultryFeedSchema.parse(data)

  const [newFeed] = await db
    .insert(poultryFeedInventory)
    .values({
      ...validatedData,
      userId: session.user.id,
      initialQuantity: validatedData.initialQuantity.toString(),
      currentQuantity: validatedData.currentQuantity.toString(),
      costPerUnit: validatedData.costPerUnit?.toString(),
      totalCost: validatedData.totalCost?.toString(),
    })
    .returning()

  revalidatePath('/dashboard/poultry/feed')
  return newFeed
}

// Update feed inventory
export async function updatePoultryFeed(id: string, data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = poultryFeedSchema.parse(data)

  const [updatedFeed] = await db
    .update(poultryFeedInventory)
    .set({
      ...validatedData,
      initialQuantity: validatedData.initialQuantity.toString(),
      currentQuantity: validatedData.currentQuantity.toString(),
      costPerUnit: validatedData.costPerUnit?.toString(),
      totalCost: validatedData.totalCost?.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(poultryFeedInventory.id, id),
        eq(poultryFeedInventory.userId, session.user.id),
        sql`${poultryFeedInventory.deletedAt} IS NULL`
      )
    )
    .returning()

  if (!updatedFeed) {
    throw new Error('Feed not found')
  }

  revalidatePath('/dashboard/poultry/feed')
  return updatedFeed
}

// Delete feed inventory (soft delete)
export async function deletePoultryFeed(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await db
    .update(poultryFeedInventory)
    .set({
      deletedAt: new Date(),
    })
    .where(and(eq(poultryFeedInventory.id, id), eq(poultryFeedInventory.userId, session.user.id)))

  revalidatePath('/dashboard/poultry/feed')
}

// Record feed usage
export async function recordFeedUsage(data: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const validatedData = feedUsageSchema.parse(data)

  // Verify flock and feed ownership
  const flock = await db.query.flocks.findFirst({
    where: and(
      eq(flocks.id, validatedData.flockId),
      eq(flocks.userId, session.user.id),
      sql`${flocks.deletedAt} IS NULL`
    ),
  })

  if (!flock) {
    throw new Error('Flock not found')
  }

  const feed = await db.query.poultryFeedInventory.findFirst({
    where: and(
      eq(poultryFeedInventory.id, validatedData.feedId),
      eq(poultryFeedInventory.userId, session.user.id),
      sql`${poultryFeedInventory.deletedAt} IS NULL`
    ),
  })

  if (!feed) {
    throw new Error('Feed not found')
  }

  // Check if enough feed is available
  if (Number(feed.currentQuantity) < validatedData.quantityUsed) {
    throw new Error('Insufficient feed quantity available')
  }

  // Create usage record
  const [usageRecord] = await db
    .insert(feedUsageRecords)
    .values({
      ...validatedData,
      userId: session.user.id,
      quantityUsed: validatedData.quantityUsed.toString(),
    })
    .returning()

  // Update feed inventory
  await db
    .update(poultryFeedInventory)
    .set({
      currentQuantity: sql`${poultryFeedInventory.currentQuantity} - ${validatedData.quantityUsed}`,
      updatedAt: new Date(),
    })
    .where(eq(poultryFeedInventory.id, validatedData.feedId))

  revalidatePath('/dashboard/poultry/feed')
  revalidatePath(`/dashboard/poultry/flocks/${validatedData.flockId}`)
  return usageRecord
}

// Get feed usage records
export async function getFeedUsageRecords(flockId?: string, feedId?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  const records = await db.query.feedUsageRecords.findMany({
    where: and(
      eq(feedUsageRecords.userId, session.user.id),
      flockId ? eq(feedUsageRecords.flockId, flockId) : undefined,
      feedId ? eq(feedUsageRecords.feedId, feedId) : undefined
    ),
    with: {
      flock: true,
      feed: true,
    },
    orderBy: [desc(feedUsageRecords.usageDate)],
  })

  return records
}

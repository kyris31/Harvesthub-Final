'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { sales } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { saleSchema, type SaleFormData } from '@/lib/validations/business'

export async function getSales(filters?: { startDate?: string; endDate?: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const whereConditions = [eq(sales.userId, session.user.id), isNull(sales.deletedAt)]

  if (filters?.startDate) whereConditions.push(gte(sales.saleDate, filters.startDate))
  if (filters?.endDate) whereConditions.push(lte(sales.saleDate, filters.endDate))

  return await db.query.sales.findMany({
    where: and(...whereConditions),
    orderBy: [desc(sales.saleDate)],
    with: { customer: true },
  })
}

export async function getSale(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const sale = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
    with: { customer: true },
  })

  if (!sale) throw new Error('Sale not found')
  return sale
}

export async function createSale(data: SaleFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = saleSchema.parse(data)
  const [sale] = await db
    .insert(sales)
    .values({
      ...validated,
      customerId: validated.customerId || null,
      paymentMethod: validated.paymentMethod || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/sales')
  return sale
}

export async function updateSale(id: string, data: SaleFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = saleSchema.parse(data)
  const existing = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
  })

  if (!existing) throw new Error('Sale not found')

  const [updated] = await db
    .update(sales)
    .set({
      ...validated,
      customerId: validated.customerId || null,
      paymentMethod: validated.paymentMethod || null,
      updatedAt: new Date(),
    })
    .where(eq(sales.id, id))
    .returning()

  revalidatePath('/dashboard/sales')
  revalidatePath(`/dashboard/sales/${id}`)
  return updated
}

export async function deleteSale(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.sales.findFirst({
    where: and(eq(sales.id, id), eq(sales.userId, session.user.id), isNull(sales.deletedAt)),
  })

  if (!existing) throw new Error('Sale not found')

  await db.update(sales).set({ deletedAt: new Date() }).where(eq(sales.id, id))
  revalidatePath('/dashboard/sales')
}

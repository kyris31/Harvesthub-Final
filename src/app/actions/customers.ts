'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { customers } from '@/lib/db/schema'
import { and, eq, isNull, desc, or, ilike } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { customerSchema, type CustomerFormData } from '@/lib/validations/business'

export async function getCustomers(search?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const whereConditions = [eq(customers.userId, session.user.id), isNull(customers.deletedAt)]

  if (search) {
    whereConditions.push(
      or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.email, `%${search}%`),
        ilike(customers.phone, `%${search}%`)
      )!
    )
  }

  return await db.query.customers.findMany({
    where: and(...whereConditions),
    orderBy: [desc(customers.createdAt)],
  })
}

export async function getCustomer(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const customer = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.userId, session.user.id),
      isNull(customers.deletedAt)
    ),
    with: {
      sales: {
        orderBy: (sales, { desc }) => [desc(sales.saleDate)],
        limit: 10,
      },
    },
  })

  if (!customer) {
    throw new Error('Customer not found')
  }

  return customer
}

export async function createCustomer(data: CustomerFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = customerSchema.parse(data)

  const [customer] = await db
    .insert(customers)
    .values({
      ...validated,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/customers')
  return customer
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  const validated = customerSchema.parse(data)

  // Verify ownership
  const existing = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.userId, session.user.id),
      isNull(customers.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Customer not found')
  }

  const [updated] = await db
    .update(customers)
    .set({
      ...validated,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning()

  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${id}`)
  return updated
}

export async function deleteCustomer(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const existing = await db.query.customers.findFirst({
    where: and(
      eq(customers.id, id),
      eq(customers.userId, session.user.id),
      isNull(customers.deletedAt)
    ),
  })

  if (!existing) {
    throw new Error('Customer not found')
  }

  // Soft delete
  await db.update(customers).set({ deletedAt: new Date() }).where(eq(customers.id, id))

  revalidatePath('/dashboard/customers')
}

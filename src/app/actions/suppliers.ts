'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { suppliers } from '@/lib/db/schema'
import { and, eq, isNull, desc, or, ilike } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { supplierSchema, type SupplierFormData } from '@/lib/validations/business'

export async function getSuppliers(search?: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const whereConditions = [eq(suppliers.userId, session.user.id), isNull(suppliers.deletedAt)]

  if (search) {
    whereConditions.push(
      or(ilike(suppliers.name, `%${search}%`), ilike(suppliers.email, `%${search}%`))!
    )
  }

  return await db.query.suppliers.findMany({
    where: and(...whereConditions),
    orderBy: [desc(suppliers.createdAt)],
  })
}

export async function getSupplier(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const supplier = await db.query.suppliers.findFirst({
    where: and(
      eq(suppliers.id, id),
      eq(suppliers.userId, session.user.id),
      isNull(suppliers.deletedAt)
    ),
  })

  if (!supplier) throw new Error('Supplier not found')
  return supplier
}

export async function createSupplier(data: SupplierFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = supplierSchema.parse(data)
  const [supplier] = await db
    .insert(suppliers)
    .values({
      ...validated,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      supplierType: validated.supplierType || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/suppliers')
  return supplier
}

export async function updateSupplier(id: string, data: SupplierFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = supplierSchema.parse(data)
  const existing = await db.query.suppliers.findFirst({
    where: and(
      eq(suppliers.id, id),
      eq(suppliers.userId, session.user.id),
      isNull(suppliers.deletedAt)
    ),
  })

  if (!existing) throw new Error('Supplier not found')

  const [updated] = await db
    .update(suppliers)
    .set({
      ...validated,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      supplierType: validated.supplierType || null,
      updatedAt: new Date(),
    })
    .where(eq(suppliers.id, id))
    .returning()

  revalidatePath('/dashboard/suppliers')
  revalidatePath(`/dashboard/suppliers/${id}`)
  return updated
}

export async function deleteSupplier(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.suppliers.findFirst({
    where: and(
      eq(suppliers.id, id),
      eq(suppliers.userId, session.user.id),
      isNull(suppliers.deletedAt)
    ),
  })

  if (!existing) throw new Error('Supplier not found')

  await db.update(suppliers).set({ deletedAt: new Date() }).where(eq(suppliers.id, id))
  revalidatePath('/dashboard/suppliers')
}

'use server'

import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { and, eq, isNull, desc, gte, lte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { expenseSchema, type ExpenseFormData } from '@/lib/validations/business'

export async function getExpenses(filters?: {
  startDate?: string
  endDate?: string
  category?: string
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const whereConditions = [eq(expenses.userId, session.user.id), isNull(expenses.deletedAt)]

  if (filters?.startDate) whereConditions.push(gte(expenses.expenseDate, filters.startDate))
  if (filters?.endDate) whereConditions.push(lte(expenses.expenseDate, filters.endDate))
  if (filters?.category) whereConditions.push(eq(expenses.category, filters.category))

  return await db.query.expenses.findMany({
    where: and(...whereConditions),
    orderBy: [desc(expenses.expenseDate)],
    with: { supplier: true },
  })
}

export async function getExpense(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const expense = await db.query.expenses.findFirst({
    where: and(
      eq(expenses.id, id),
      eq(expenses.userId, session.user.id),
      isNull(expenses.deletedAt)
    ),
    with: { supplier: true },
  })

  if (!expense) throw new Error('Expense not found')
  return expense
}

export async function createExpense(data: ExpenseFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = expenseSchema.parse(data)
  const [expense] = await db
    .insert(expenses)
    .values({
      ...validated,
      supplierId: validated.supplierId || null,
      paymentMethod: validated.paymentMethod || null,
      userId: session.user.id,
    })
    .returning()

  revalidatePath('/dashboard/expenses')
  return expense
}

export async function updateExpense(id: string, data: ExpenseFormData) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const validated = expenseSchema.parse(data)
  const existing = await db.query.expenses.findFirst({
    where: and(
      eq(expenses.id, id),
      eq(expenses.userId, session.user.id),
      isNull(expenses.deletedAt)
    ),
  })

  if (!existing) throw new Error('Expense not found')

  const [updated] = await db
    .update(expenses)
    .set({
      ...validated,
      supplierId: validated.supplierId || null,
      paymentMethod: validated.paymentMethod || null,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning()

  revalidatePath('/dashboard/expenses')
  revalidatePath(`/dashboard/expenses/${id}`)
  return updated
}

export async function deleteExpense(id: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const existing = await db.query.expenses.findFirst({
    where: and(
      eq(expenses.id, id),
      eq(expenses.userId, session.user.id),
      isNull(expenses.deletedAt)
    ),
  })

  if (!existing) throw new Error('Expense not found')

  await db.update(expenses).set({ deletedAt: new Date() }).where(eq(expenses.id, id))
  revalidatePath('/dashboard/expenses')
}

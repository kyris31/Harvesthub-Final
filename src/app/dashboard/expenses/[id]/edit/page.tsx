import { getExpense } from '@/app/actions/expenses'
import { ExpenseForm } from '@/components/business/expense-form'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'
import { notFound } from 'next/navigation'

export default async function EditExpensePage({ params }: { params: { id: string } }) {
  const { id } = await params
  const [expense, suppliers] = await Promise.all([
    getExpense(id).catch(() => null),
    getSuppliersForSelect(),
  ])

  if (!expense) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Expense</h1>
        <p className="text-muted-foreground">Update expense details</p>
      </div>
      <ExpenseForm
        mode="edit"
        suppliers={suppliers}
        defaultValues={{
          id: expense.id,
          supplierId: expense.supplierId || '',
          category: expense.category as
            | 'seeds'
            | 'fertilizer'
            | 'pesticide'
            | 'equipment'
            | 'labor'
            | 'utilities'
            | 'other',
          description: expense.description,
          expenseDate: expense.expenseDate,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod || '',
          notes: expense.notes || '',
        }}
      />
    </div>
  )
}

import { ExpenseForm } from '@/components/business/expense-form'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'

export default async function NewExpensePage() {
  const suppliers = await getSuppliersForSelect()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Expense</h1>
        <p className="text-muted-foreground">Record a farm expense</p>
      </div>
      <ExpenseForm mode="create" suppliers={suppliers} />
    </div>
  )
}

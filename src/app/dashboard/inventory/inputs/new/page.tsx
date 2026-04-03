import { InputInventoryForm } from '@/components/inventory/input-inventory-form'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'

export default async function NewInputItemPage() {
  const suppliers = await getSuppliersForSelect()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Input Item</h1>
        <p className="text-muted-foreground">
          Add a new fertilizer, pesticide, tool, or other farm input
        </p>
      </div>

      <InputInventoryForm mode="create" suppliers={suppliers} />
    </div>
  )
}

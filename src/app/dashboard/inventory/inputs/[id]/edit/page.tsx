import { getInputItem } from '@/app/actions/input-inventory'
import { InputInventoryForm } from '@/components/inventory/input-inventory-form'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'
import { notFound } from 'next/navigation'

interface EditInputItemPageProps {
  params: { id: string }
}

export default async function EditInputItemPage({ params }: EditInputItemPageProps) {
  const { id } = await params
  const [item, suppliers] = await Promise.all([
    getInputItem(id).catch(() => null),
    getSuppliersForSelect(),
  ])

  if (!item) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Input Item</h1>
        <p className="text-muted-foreground">Update {item.name} details</p>
      </div>

      <InputInventoryForm
        mode="edit"
        suppliers={suppliers}
        defaultValues={{
          id: item.id,
          name: item.name,
          type: item.type as 'fertilizer' | 'pesticide' | 'soil_amendment' | 'tool' | 'other',
          supplierId: item.supplierId || '',
          purchaseDate: item.purchaseDate || '',
          initialQuantity: item.initialQuantity || '',
          currentQuantity: item.currentQuantity,
          quantityUnit: item.quantityUnit,
          costPerUnit: item.costPerUnit || '',
          totalCost: item.totalCost || '',
          minimumStockLevel: item.minimumStockLevel || '',
          notes: item.notes || '',
        }}
      />
    </div>
  )
}

import { SupplierForm } from '@/components/business/supplier-form'

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Supplier</h1>
        <p className="text-muted-foreground">Add a new supplier to your records</p>
      </div>
      <SupplierForm mode="create" />
    </div>
  )
}

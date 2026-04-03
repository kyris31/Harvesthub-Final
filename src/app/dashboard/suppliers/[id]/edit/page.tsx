import { getSupplier } from '@/app/actions/suppliers'
import { SupplierForm } from '@/components/business/supplier-form'
import { notFound } from 'next/navigation'

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supplier = await getSupplier(id).catch(() => null)
  if (!supplier) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Supplier</h1>
        <p className="text-muted-foreground">Update {supplier.name} details</p>
      </div>
      <SupplierForm
        mode="edit"
        defaultValues={{
          id: supplier.id,
          name: supplier.name,
          supplierType: supplier.supplierType || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          notes: supplier.notes || '',
        }}
      />
    </div>
  )
}

import { SupplierInvoiceForm } from '@/components/invoices/supplier-invoice-form'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'

export default async function NewInvoicePage() {
  const suppliers = await getSuppliersForSelect()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
        <p className="text-muted-foreground">Create a new supplier invoice</p>
      </div>
      <SupplierInvoiceForm mode="create" suppliers={suppliers} />
    </div>
  )
}

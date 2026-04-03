import { getSupplierInvoice } from '@/app/actions/supplier-invoices'
import { SupplierInvoiceForm } from '@/components/invoices/supplier-invoice-form'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'
import { notFound } from 'next/navigation'

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const { id } = await params
  const [invoice, suppliers] = await Promise.all([
    getSupplierInvoice(id).catch(() => null),
    getSuppliersForSelect(),
  ])

  if (!invoice) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
        <p className="text-muted-foreground">Update invoice details</p>
      </div>
      <SupplierInvoiceForm
        mode="edit"
        suppliers={suppliers}
        defaultValues={{
          id: invoice.id,
          supplierId: invoice.supplierId || '',
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate || '',
          items: invoice.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            category: item.category as
              | 'seeds'
              | 'fertilizer'
              | 'pesticide'
              | 'equipment'
              | 'other'
              | ''
              | undefined,
            notes: item.notes || '',
          })),
          notes: invoice.notes || '',
        }}
      />
    </div>
  )
}

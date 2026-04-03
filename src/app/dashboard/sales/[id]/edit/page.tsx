import { getSale } from '@/app/actions/sales'
import { SaleForm } from '@/components/business/sale-form'
import { getCustomers } from '@/app/actions/customers'
import { notFound } from 'next/navigation'

export default async function EditSalePage({ params }: { params: { id: string } }) {
  const { id } = await params
  const [sale, customers] = await Promise.all([getSale(id).catch(() => null), getCustomers()])

  if (!sale) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Sale</h1>
        <p className="text-muted-foreground">Update sale details</p>
      </div>
      <SaleForm
        mode="edit"
        customers={customers}
        defaultValues={{
          id: sale.id,
          customerId: sale.customerId || '',
          saleDate: sale.saleDate,
          totalAmount: sale.totalAmount,
          paymentStatus: sale.paymentStatus as 'pending' | 'paid' | 'partial' | 'overdue',
          paymentMethod: sale.paymentMethod || '',
          amountPaid: sale.amountPaid,
          notes: sale.notes || '',
        }}
      />
    </div>
  )
}

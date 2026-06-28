import { getSale } from '@/app/actions/sales'
import { SaleFormEnhanced } from '@/components/business/sale-form-enhanced'
import { getCustomers } from '@/app/actions/customers'
import { getAvailableHarvestsForSaleEdit } from '@/app/actions/form-helpers'
import { notFound } from 'next/navigation'

export default async function EditSalePage({ params }: { params: { id: string } }) {
  const { id } = await params
  const [sale, customers, availableHarvests] = await Promise.all([
    getSale(id).catch(() => null),
    getCustomers(),
    getAvailableHarvestsForSaleEdit(id),
  ])

  if (!sale) notFound()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Sale</h1>
        <p className="text-muted-foreground">Update sale details</p>
      </div>
      <SaleFormEnhanced
        mode="edit"
        saleId={sale.id}
        customers={customers}
        availableHarvests={availableHarvests}
        initialValues={{
          customerId: sale.customerId || '',
          saleDate: sale.saleDate,
          paymentStatus: sale.paymentStatus as 'pending' | 'paid' | 'partial' | 'overdue',
          paymentMethod: (sale.paymentMethod ?? '') as
            | ''
            | 'cash'
            | 'bank_transfer'
            | 'card'
            | 'check'
            | 'other',
          amountPaid: sale.amountPaid ?? '0',
          notes: sale.notes || '',
          items:
            sale.saleItems.length > 0
              ? sale.saleItems.map((item) => ({
                  harvestLogId: item.harvestLogId
                    ? item.harvestLogId
                    : item.eggProductionId
                      ? `egg:${item.eggProductionId}`
                      : '',
                  quantity: item.quantity,
                  pricePerUnit: item.unitPrice,
                }))
              : [{ harvestLogId: '', quantity: '', pricePerUnit: '' }],
        }}
      />
    </div>
  )
}

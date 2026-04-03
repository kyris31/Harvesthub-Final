import { SaleFormEnhanced } from '@/components/business/sale-form-enhanced'
import { getCustomers } from '@/app/actions/customers'
import { getAvailableHarvestsForSale } from '@/app/actions/form-helpers'

export default async function NewSalePage() {
  const [customers, availableHarvests] = await Promise.all([
    getCustomers(),
    getAvailableHarvestsForSale(),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
        <p className="text-muted-foreground">Record a sale to a customer</p>
      </div>
      <SaleFormEnhanced customers={customers} availableHarvests={availableHarvests} />
    </div>
  )
}

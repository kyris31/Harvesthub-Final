import { SeedBatchForm } from '@/components/inventory/seed-batch-form'
import { getCropsForSelect, getSuppliersForSelect } from '@/app/actions/form-helpers'

export default async function NewSeedBatchPage() {
  const [crops, suppliers] = await Promise.all([getCropsForSelect(), getSuppliersForSelect()])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Seed Batch</h1>
        <p className="text-muted-foreground">Add a new batch of seeds to your inventory</p>
      </div>

      <SeedBatchForm mode="create" crops={crops} suppliers={suppliers} />
    </div>
  )
}

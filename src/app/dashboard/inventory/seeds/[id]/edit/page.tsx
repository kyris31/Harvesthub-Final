import { getSeedBatch } from '@/app/actions/seed-batches'
import { SeedBatchForm } from '@/components/inventory/seed-batch-form'
import { getCropsForSelect, getSuppliersForSelect } from '@/app/actions/form-helpers'
import { notFound } from 'next/navigation'

interface EditSeedBatchPageProps {
  params: { id: string }
}

export default async function EditSeedBatchPage({ params }: EditSeedBatchPageProps) {
  const { id } = await params
  const [batch, crops, suppliers] = await Promise.all([
    getSeedBatch(id).catch(() => null),
    getCropsForSelect(),
    getSuppliersForSelect(),
  ])

  if (!batch) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Seed Batch</h1>
        <p className="text-muted-foreground">Update {batch.batchCode} details</p>
      </div>

      <SeedBatchForm
        mode="edit"
        crops={crops}
        suppliers={suppliers}
        defaultValues={{
          id: batch.id,
          cropId: batch.cropId,
          supplierId: batch.supplierId || '',
          batchCode: batch.batchCode,
          purchaseDate: batch.purchaseDate || '',
          initialQuantity: batch.initialQuantity,
          currentQuantity: batch.currentQuantity,
          quantityUnit: batch.quantityUnit,
          costPerUnit: batch.costPerUnit || '',
          totalCost: batch.totalCost || '',
          organicCertified: batch.organicCertified || false,
          notes: batch.notes || '',
        }}
      />
    </div>
  )
}

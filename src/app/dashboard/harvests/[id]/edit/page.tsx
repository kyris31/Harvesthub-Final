import { getHarvestLog } from '@/app/actions/harvests'
import { HarvestForm } from '@/components/harvests/harvest-form'
import { getActivePlantingsForSelect } from '@/app/actions/form-helpers'
import { getTrees } from '@/app/actions/trees'
import { notFound } from 'next/navigation'

interface EditHarvestPageProps {
  params: { id: string }
}

export default async function EditHarvestPage({ params }: EditHarvestPageProps) {
  const { id } = await params
  const [harvest, plantings, trees] = await Promise.all([
    getHarvestLog(id).catch(() => null),
    getActivePlantingsForSelect(),
    getTrees(),
  ])

  if (!harvest) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Harvest</h1>
        <p className="text-muted-foreground">Update harvest details</p>
      </div>

      <HarvestForm
        mode="edit"
        plantings={plantings}
        trees={trees}
        defaultValues={{
          id: harvest.id,
          sourceType: (harvest.treeId ? 'tree' : 'planting') as 'tree' | 'planting',
          plantingLogId: harvest.plantingLogId ?? undefined,
          treeId: harvest.treeId ?? undefined,
          harvestDate: harvest.harvestDate,
          quantityHarvested: harvest.quantityHarvested,
          quantityUnit: harvest.quantityUnit,
          currentStock: harvest.currentStock,
          qualityGrade: harvest.qualityGrade || '',
          notes: harvest.notes || '',
        }}
      />
    </div>
  )
}

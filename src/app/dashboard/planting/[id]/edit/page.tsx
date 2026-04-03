import { getPlantingLog } from '@/app/actions/planting'
import { PlantingForm } from '@/components/planting/planting-form'
import { getCropsForSelect, getPlotsForSelect } from '@/app/actions/form-helpers'
import { notFound } from 'next/navigation'

interface EditPlantingPageProps {
  params: { id: string }
}

export default async function EditPlantingPage({ params }: EditPlantingPageProps) {
  const { id } = await params
  const [planting, crops, plots] = await Promise.all([
    getPlantingLog(id).catch(() => null),
    getCropsForSelect(),
    getPlotsForSelect(),
  ])

  if (!planting) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Planting</h1>
        <p className="text-muted-foreground">Update planting details</p>
      </div>

      <PlantingForm
        mode="edit"
        crops={crops}
        plots={plots}
        defaultValues={{
          id: planting.id,
          cropId: planting.cropId,
          plotId: planting.plotId || '',
          plantingDate: planting.plantingDate,
          quantityPlanted: planting.quantityPlanted,
          quantityUnit: planting.quantityUnit,
          expectedHarvestDate: planting.expectedHarvestDate || '',
          status: planting.status as 'active' | 'harvested' | 'failed' | 'completed',
          notes: planting.notes || '',
        }}
      />
    </div>
  )
}

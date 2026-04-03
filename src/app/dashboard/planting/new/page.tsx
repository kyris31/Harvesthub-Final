import { PlantingForm } from '@/components/planting/planting-form'
import { getCropsForSelect, getPlotsForSelect } from '@/app/actions/form-helpers'

export default async function NewPlantingPage() {
  const [crops, plots] = await Promise.all([getCropsForSelect(), getPlotsForSelect()])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Planting</h1>
        <p className="text-muted-foreground">Record a new crop planting</p>
      </div>

      <PlantingForm mode="create" crops={crops} plots={plots} />
    </div>
  )
}

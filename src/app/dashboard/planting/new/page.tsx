import { PlantingForm } from '@/components/planting/planting-form'
import {
  getCropsForSelect,
  getPlotsForSelect,
  getSeedBatchesForSelect,
  getSelfProducedSeedlingsForSelect,
  getPurchasedSeedlingsForSelect,
} from '@/app/actions/form-helpers'

export default async function NewPlantingPage() {
  const [crops, plots, seedBatches, selfProducedSeedlings, purchasedSeedlings] = await Promise.all([
    getCropsForSelect(),
    getPlotsForSelect(),
    getSeedBatchesForSelect(),
    getSelfProducedSeedlingsForSelect(),
    getPurchasedSeedlingsForSelect(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Planting</h1>
        <p className="text-muted-foreground">Record a new crop planting</p>
      </div>

      <PlantingForm
        mode="create"
        crops={crops}
        plots={plots}
        seedBatches={seedBatches}
        selfProducedSeedlings={selfProducedSeedlings}
        purchasedSeedlings={purchasedSeedlings}
      />
    </div>
  )
}

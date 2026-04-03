import { HarvestForm } from '@/components/harvests/harvest-form'
import { getActivePlantingsForSelect } from '@/app/actions/form-helpers'

export default async function NewHarvestPage() {
  const plantings = await getActivePlantingsForSelect()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Harvest</h1>
        <p className="text-muted-foreground">Log a harvest from your plantings</p>
      </div>

      {plantings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            No active plantings to harvest from. Plant some crops first!
          </p>
        </div>
      ) : (
        <HarvestForm mode="create" plantings={plantings} />
      )}
    </div>
  )
}

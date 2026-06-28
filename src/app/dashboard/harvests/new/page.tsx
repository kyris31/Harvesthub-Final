import { HarvestBatchForm } from '@/components/harvests/harvest-batch-form'
import { getActivePlantingsForSelect } from '@/app/actions/form-helpers'
import { getTrees } from '@/app/actions/trees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewHarvestPage() {
  const [plantings, treeList] = await Promise.all([getActivePlantingsForSelect(), getTrees()])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Harvest</h1>
        <p className="text-muted-foreground">
          Log one or more harvests from the same day (e.g. oranges, tomatoes, cucumbers)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harvest Details</CardTitle>
        </CardHeader>
        <CardContent>
          <HarvestBatchForm plantings={plantings} trees={treeList} />
        </CardContent>
      </Card>
    </div>
  )
}

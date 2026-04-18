import { HarvestForm } from '@/components/harvests/harvest-form'
import { getActivePlantingsForSelect } from '@/app/actions/form-helpers'
import { getTrees } from '@/app/actions/trees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewHarvestPage() {
  const [plantings, treeList] = await Promise.all([getActivePlantingsForSelect(), getTrees()])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Harvest</h1>
        <p className="text-muted-foreground">Log a harvest from a planting or tree</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Harvest Details</CardTitle>
        </CardHeader>
        <CardContent>
          <HarvestForm mode="create" plantings={plantings} trees={treeList} />
        </CardContent>
      </Card>
    </div>
  )
}

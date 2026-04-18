import { getPlantingLogs } from '@/app/actions/planting'
import { getInputInventory } from '@/app/actions/input-inventory'
import { getTrees } from '@/app/actions/trees'
import { CultivationForm } from '@/components/cultivation/cultivation-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewCultivationPage() {
  const [plantingLogs, inputInventory, treeList] = await Promise.all([
    getPlantingLogs(),
    getInputInventory(),
    getTrees(),
  ])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Cultivation Activity</h1>
        <p className="text-muted-foreground">Record a new cultivation activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>Fill in the details of the cultivation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <CultivationForm
            plantingLogs={plantingLogs}
            trees={treeList}
            inputInventory={inputInventory}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  )
}

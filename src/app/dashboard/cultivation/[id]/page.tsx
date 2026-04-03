import { getCultivationActivity, deleteCultivationActivity } from '@/app/actions/cultivation'
import { getPlantingLogs } from '@/app/actions/planting'
import { getInputInventory } from '@/app/actions/input-inventory'
import { CultivationForm } from '@/components/cultivation/cultivation-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface CultivationDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CultivationDetailPage({ params }: CultivationDetailPageProps) {
  const { id } = await params
  const activity = await getCultivationActivity(id)
  const plantingLogs = await getPlantingLogs()
  const inputInventory = await getInputInventory()

  async function handleDelete() {
    'use server'
    await deleteCultivationActivity(id)
    redirect('/dashboard/cultivation')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/cultivation">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Activity</h1>
            <p className="text-muted-foreground">Update or delete this cultivation activity</p>
          </div>
        </div>
        <form action={handleDelete}>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>Edit the details of this cultivation activity</CardDescription>
        </CardHeader>
        <CardContent>
          <CultivationForm
            plantingLogs={plantingLogs}
            inputInventory={inputInventory}
            defaultValues={{
              id: activity.id,
              plantingLogId: activity.plantingLogId || '',
              activityType: activity.activityType as any,
              activityDate: activity.activityDate,
              inputInventoryId: activity.inputInventoryId || '',
              quantityUsed: activity.quantityUsed || '',
              quantityUnit: activity.quantityUnit || '',
              cost: activity.cost || '',
              notes: activity.notes || '',
            }}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  )
}

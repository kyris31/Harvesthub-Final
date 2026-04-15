import { getPlantingLog } from '@/app/actions/planting'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface PlantingDetailPageProps {
  params: { id: string }
}

export default async function PlantingDetailPage({ params }: PlantingDetailPageProps) {
  const { id } = await params
  const planting = await getPlantingLog(id).catch(() => null)

  if (!planting) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/planting">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Plantings
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {planting.crop.name}
            {planting.crop.variety && ` (${planting.crop.variety})`}
          </h1>
          <p className="text-muted-foreground">
            Planted on {new Date(planting.plantingDate).toLocaleDateString('en-GB')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/planting/${planting.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Planting
          </Link>
        </Button>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Planting Details</CardTitle>
          <CardDescription>Information about this planting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Crop</p>
              <p className="text-base">
                {planting.crop.name}
                {planting.crop.variety && ` (${planting.crop.variety})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Plot</p>
              <p className="text-base">{planting.plot?.name || 'No plot assigned'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Planting Date</p>
              <p className="text-base">
                {new Date(planting.plantingDate).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Quantity Planted</p>
              <p className="text-base">
                {planting.quantityPlanted} {planting.quantityUnit}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Expected Harvest</p>
              <p className="text-base">
                {planting.expectedHarvestDate
                  ? new Date(planting.expectedHarvestDate).toLocaleDateString('en-GB')
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Status</p>
              <Badge
                variant={
                  planting.status === 'active'
                    ? 'default'
                    : planting.status === 'harvested'
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {planting.status}
              </Badge>
            </div>
          </div>
          {planting.notes && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">Notes</p>
              <p className="text-base">{planting.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Harvests Card */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Records</CardTitle>
          <CardDescription>Harvests from this planting</CardDescription>
        </CardHeader>
        <CardContent>
          {planting.harvestLogs && planting.harvestLogs.length > 0 ? (
            <p className="text-muted-foreground">
              {planting.harvestLogs.length} harvest{planting.harvestLogs.length !== 1 && 's'}{' '}
              recorded
            </p>
          ) : (
            <p className="text-muted-foreground">No harvests recorded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

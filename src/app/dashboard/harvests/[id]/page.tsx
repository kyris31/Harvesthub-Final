import { getHarvestLog } from '@/app/actions/harvests'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface HarvestDetailPageProps {
  params: { id: string }
}

export default async function HarvestDetailPage({ params }: HarvestDetailPageProps) {
  const { id } = await params
  const harvest = await getHarvestLog(id).catch(() => null)

  if (!harvest) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/harvests">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Harvests
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {harvest.plantingLog.crop.name}
            {harvest.plantingLog.crop.variety && ` (${harvest.plantingLog.crop.variety})`}
          </h1>
          <p className="text-muted-foreground">
            Harvested on {new Date(harvest.harvestDate).toLocaleDateString('en-GB')}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/harvests/${harvest.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Harvest
          </Link>
        </Button>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Details</CardTitle>
          <CardDescription>Information about this harvest</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Crop</p>
              <p className="text-base">
                {harvest.plantingLog.crop.name}
                {harvest.plantingLog.crop.variety && ` (${harvest.plantingLog.crop.variety})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Plot</p>
              <p className="text-base">{harvest.plantingLog.plot?.name || 'No plot'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Harvest Date</p>
              <p className="text-base">
                {new Date(harvest.harvestDate).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Quantity Harvested</p>
              <p className="text-base">
                {harvest.quantityHarvested} {harvest.quantityUnit}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Current Stock</p>
              <p className="text-base">
                {harvest.currentStock} {harvest.quantityUnit}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Quality Grade</p>
              {harvest.qualityGrade ? (
                <Badge variant="outline">{harvest.qualityGrade}</Badge>
              ) : (
                <p className="text-base">-</p>
              )}
            </div>
          </div>
          {harvest.notes && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">Notes</p>
              <p className="text-base">{harvest.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Planting Card */}
      <Card>
        <CardHeader>
          <CardTitle>Related Planting</CardTitle>
          <CardDescription>The planting this harvest came from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Planted:</span>{' '}
              {new Date(harvest.plantingLog.plantingDate).toLocaleDateString('en-GB')}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/planting/${harvest.plantingLog.id}`}>
                View Planting Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

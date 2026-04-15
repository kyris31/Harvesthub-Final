import { getSeedBatch } from '@/app/actions/seed-batches'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { notFound } from 'next/navigation'

interface SeedBatchDetailPageProps {
  params: { id: string }
}

export default async function SeedBatchDetailPage({ params }: SeedBatchDetailPageProps) {
  const { id } = await params
  const batch = await getSeedBatch(id).catch(() => null)

  if (!batch) {
    notFound()
  }

  const stockPercent = (parseFloat(batch.currentQuantity) / parseFloat(batch.initialQuantity)) * 100
  const isLowStock = stockPercent < 20

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/inventory/seeds">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Seeds
              </Link>
            </Button>
          </div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            {batch.batchCode}
            {batch.organicCertified && (
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Organic
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            {batch.crop.name} {batch.crop.variety && `(${batch.crop.variety})`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/inventory/seeds/${batch.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Batch
          </Link>
        </Button>
      </div>

      {/* Stock Status Card */}
      <Card className={isLowStock ? 'border-destructive' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Stock Level
            {isLowStock && <Badge variant="destructive">Low Stock</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Current Stock:</span>
              <span className="text-2xl font-bold">
                {batch.currentQuantity} {batch.quantityUnit}
              </span>
            </div>
            <div className="bg-secondary h-4 w-full overflow-hidden rounded-full">
              <div
                className={`h-full ${
                  stockPercent > 50
                    ? 'bg-green-500'
                    : stockPercent > 20
                      ? 'bg-yellow-500'
                      : 'bg-destructive'
                }`}
                style={{ width: `${Math.min(stockPercent, 100)}%` }}
              />
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>0 {batch.quantityUnit}</span>
              <span>{stockPercent.toFixed(1)}%</span>
              <span>
                {batch.initialQuantity} {batch.quantityUnit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>Information about this seed batch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Crop</p>
              <p className="text-base">
                {batch.crop.name}
                {batch.crop.variety && ` (${batch.crop.variety})`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Supplier</p>
              <p className="text-base">{batch.supplier?.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Purchase Date</p>
              <p className="text-base">
                {batch.purchaseDate
                  ? new Date(batch.purchaseDate).toLocaleDateString('en-GB')
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Batch Code</p>
              <p className="font-mono text-base">{batch.batchCode}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Initial Quantity</p>
              <p className="text-base">
                {batch.initialQuantity} {batch.quantityUnit}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Current Quantity</p>
              <p className={`text-base ${isLowStock ? 'text-destructive font-medium' : ''}`}>
                {batch.currentQuantity} {batch.quantityUnit}
              </p>
            </div>
            {batch.costPerUnit && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Cost Per Unit</p>
                <p className="text-base">${batch.costPerUnit}</p>
              </div>
            )}
            {batch.totalCost && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Cost</p>
                <p className="text-base">${batch.totalCost}</p>
              </div>
            )}
          </div>
          {batch.notes && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">Notes</p>
              <p className="text-base">{batch.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

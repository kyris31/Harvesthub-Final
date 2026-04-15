import { getInputItem } from '@/app/actions/input-inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft, AlertTriangle } from 'lucide-react'
import { notFound } from 'next/navigation'

interface InputItemDetailPageProps {
  params: { id: string }
}

export default async function InputItemDetailPage({ params }: InputItemDetailPageProps) {
  const { id } = await params
  const item = await getInputItem(id).catch(() => null)

  if (!item) {
    notFound()
  }

  const isLowStock =
    item.minimumStockLevel && parseFloat(item.currentQuantity) < parseFloat(item.minimumStockLevel)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/inventory/inputs">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Inputs
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {item.type.replace('_', ' ')}
            </Badge>
            {isLowStock && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/inventory/inputs/${item.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </Link>
        </Button>
      </div>

      {/* Stock Status Card */}
      {item.minimumStockLevel && (
        <Card className={isLowStock ? 'border-destructive' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Stock Level
              {isLowStock && <Badge variant="destructive">Below Minimum</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Current:</span>
                <span className={`text-2xl font-bold ${isLowStock ? 'text-destructive' : ''}`}>
                  {item.currentQuantity} {item.quantityUnit}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Minimum Level:</span>
                <span>
                  {item.minimumStockLevel} {item.quantityUnit}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>Information about this input item</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Name</p>
              <p className="text-base">{item.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Type</p>
              <p className="text-base capitalize">{item.type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Supplier</p>
              <p className="text-base">{item.supplier?.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Purchase Date</p>
              <p className="text-base">
                {item.purchaseDate
                  ? new Date(item.purchaseDate).toLocaleDateString('en-GB')
                  : 'Not specified'}
              </p>
            </div>
            {item.initialQuantity && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Initial Quantity</p>
                <p className="text-base">
                  {item.initialQuantity} {item.quantityUnit}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-sm font-medium">Current Quantity</p>
              <p className={`text-base ${isLowStock ? 'text-destructive font-medium' : ''}`}>
                {item.currentQuantity} {item.quantityUnit}
              </p>
            </div>
            {item.costPerUnit && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Cost Per Unit</p>
                <p className="text-base">${item.costPerUnit}</p>
              </div>
            )}
            {item.totalCost && (
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Cost</p>
                <p className="text-base">${item.totalCost}</p>
              </div>
            )}
          </div>
          {item.notes && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">Notes</p>
              <p className="text-base">{item.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

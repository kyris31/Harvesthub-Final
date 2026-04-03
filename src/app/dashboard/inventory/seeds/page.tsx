import { getSeedBatches } from '@/app/actions/seed-batches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Package } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SeedBatchFilters } from '@/components/inventory/seed-batch-filters'

interface SeedsPageProps {
  searchParams: Promise<{ search?: string; sortBy?: string; sortOrder?: string }>
}

export default async function SeedsInventoryPage({ searchParams }: SeedsPageProps) {
  const { search, sortBy, sortOrder } = await searchParams
  const seedBatches = await getSeedBatches({ search, sortBy, sortOrder })

  // Calculate low stock items (current < 20% of initial)
  const lowStockCount = seedBatches.filter(
    (batch) => parseFloat(batch.currentQuantity) < parseFloat(batch.initialQuantity) * 0.2
  ).length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seeds Inventory</h1>
          <p className="text-muted-foreground">Manage your seed batches and stock levels</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/inventory/seeds/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Seed Batch
          </Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1">
          <Input
            name="search"
            placeholder="Search by batch code..."
            defaultValue={search}
            className="max-w-sm"
          />
        </form>
        <SeedBatchFilters />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seedBatches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organic Batches</CardTitle>
            <Badge variant="outline" className="h-4">
              Organic
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {seedBatches.filter((b) => b.organicCertified).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seeds Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Seed Batches</CardTitle>
          <CardDescription>
            {seedBatches.length} {seedBatches.length === 1 ? 'batch' : 'batches'} in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seedBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {search
                  ? 'No batches found matching your search.'
                  : 'No seed batches yet. Add your first batch to get started!'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/inventory/seeds/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Batch
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Code</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seedBatches.map((batch) => {
                  const stockPercent =
                    (parseFloat(batch.currentQuantity) / parseFloat(batch.initialQuantity)) * 100
                  const isLowStock = stockPercent < 20

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/inventory/seeds/${batch.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          {batch.batchCode}
                          {batch.organicCertified && (
                            <Badge variant="outline" className="text-xs">
                              Organic
                            </Badge>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {batch.crop.name}
                        {batch.crop.variety && ` (${batch.crop.variety})`}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? 'text-destructive font-medium' : ''}>
                            {batch.currentQuantity} / {batch.initialQuantity} {batch.quantityUnit}
                          </span>
                          {isLowStock && (
                            <Badge variant="destructive" className="text-xs">
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
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
                      </TableCell>
                      <TableCell>{batch.supplier?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/inventory/seeds/${batch.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { getCrops } from '@/app/actions/crops'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DeleteCropButton } from '@/components/crops/delete-crop-button'
import { CropsFilters } from '@/components/crops/crops-filters'

interface CropsPageProps {
  searchParams: {
    search?: string
    category?: string
    sortBy?: string
    sortOrder?: string
  }
}

export default async function CropsPage({ searchParams }: CropsPageProps) {
  const { search, category, sortBy, sortOrder } = await searchParams
  const crops = await getCrops({ search, category, sortBy, sortOrder })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crops</h1>
          <p className="text-muted-foreground">Manage your crop varieties and categories</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crops/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Crop
          </Link>
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="flex-1">
          <Input
            name="search"
            placeholder="Search crops..."
            defaultValue={search}
            className="max-w-sm"
          />
        </form>
        <CropsFilters />
      </div>

      {/* Crops Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Crops</CardTitle>
          <CardDescription>
            {crops.length} {crops.length === 1 ? 'crop' : 'crops'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {crops.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {search || category
                  ? 'No crops found matching your filters.'
                  : 'No crops yet. Add your first crop to get started!'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/crops/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Crop
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crops.map((crop) => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/crops/${crop.id}`} className="hover:underline">
                        {crop.name}
                      </Link>
                    </TableCell>
                    <TableCell>{crop.variety || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{crop.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{crop.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/crops/${crop.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteCropButton cropId={crop.id} cropName={crop.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { getPlantingLogs } from '@/app/actions/planting'
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
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DeletePlantingButton } from '@/components/planting/delete-planting-button'

export default async function PlantingPage() {
  const plantings = await getPlantingLogs()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planting Logs</h1>
          <p className="text-muted-foreground">Track your crop plantings and their progress</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/planting/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Planting
          </Link>
        </Button>
      </div>

      {/* Plantings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Plantings</CardTitle>
          <CardDescription>
            {plantings.length} {plantings.length === 1 ? 'planting' : 'plantings'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plantings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No plantings yet. Add your first planting to get started!
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/planting/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Planting
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Plot</TableHead>
                  <TableHead>Planting Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expected Harvest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantings.map((planting) => (
                  <TableRow key={planting.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/planting/${planting.id}`} className="hover:underline">
                        {planting.crop.name}
                        {planting.crop.variety && ` (${planting.crop.variety})`}
                      </Link>
                    </TableCell>
                    <TableCell>{planting.plot?.name || '-'}</TableCell>
                    <TableCell>{new Date(planting.plantingDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {planting.quantityPlanted} {planting.quantityUnit}
                    </TableCell>
                    <TableCell>
                      {planting.expectedHarvestDate
                        ? new Date(planting.expectedHarvestDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/planting/${planting.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeletePlantingButton
                          plantingId={planting.id}
                          cropName={planting.crop.name}
                        />
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

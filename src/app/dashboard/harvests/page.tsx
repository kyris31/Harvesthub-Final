import { getHarvestLogs } from '@/app/actions/harvests'
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
import { DeleteHarvestButton } from '@/components/harvests/delete-harvest-button'

export default async function HarvestsPage() {
  const harvests = await getHarvestLogs()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Harvest Logs</h1>
          <p className="text-muted-foreground">Track your harvests and current stock</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/harvests/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Harvest
          </Link>
        </Button>
      </div>

      {/* Harvests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Harvests</CardTitle>
          <CardDescription>
            {harvests.length} {harvests.length === 1 ? 'harvest' : 'harvests'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {harvests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No harvests yet. Record your first harvest to get started!
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/harvests/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Harvest
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Harvest Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvests.map((harvest) => (
                  <TableRow key={harvest.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/harvests/${harvest.id}`} className="hover:underline">
                        {harvest.plantingLog.crop.name}
                        {harvest.plantingLog.crop.variety &&
                          ` (${harvest.plantingLog.crop.variety})`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(harvest.harvestDate).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell>
                      {harvest.quantityHarvested} {harvest.quantityUnit}
                    </TableCell>
                    <TableCell>
                      {harvest.currentStock} {harvest.quantityUnit}
                    </TableCell>
                    <TableCell>
                      {harvest.qualityGrade ? (
                        <Badge variant="outline">{harvest.qualityGrade}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/harvests/${harvest.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteHarvestButton
                          harvestId={harvest.id}
                          cropName={harvest.plantingLog.crop.name}
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

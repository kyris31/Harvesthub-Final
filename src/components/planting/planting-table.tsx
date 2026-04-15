'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Trash2, Edit } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PlantingFormDialog } from './planting-form-dialog'
import { HarvestFormDialog } from './harvest-form-dialog'
import { PlantingStatusBadge } from './planting-status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface PlantingTableProps {
  plantings: any[]
  onRefresh: () => void
}

export function PlantingTable({ plantings, onRefresh }: PlantingTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`/api/planting-logs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete planting')
      }

      toast.success('Planting deleted successfully')
      onRefresh()
    } catch (error) {
      toast.error('Failed to delete planting')
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  if (plantings.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold">No planting records yet</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Record your first planting to start tracking your crop lifecycle.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Crop</TableHead>
            <TableHead>Plot</TableHead>
            <TableHead>Planted</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Expected Harvest</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plantings.map((planting) => (
            <TableRow key={planting.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                {planting.cropName}
                {planting.cropVariety && (
                  <span className="text-muted-foreground ml-1">- {planting.cropVariety}</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{planting.plotName || '-'}</TableCell>
              <TableCell className="text-sm">
                {new Date(planting.plantingDate).toLocaleDateString('en-GB')}
                <span className="text-muted-foreground block text-xs">
                  {formatDistanceToNow(new Date(planting.plantingDate), {
                    addSuffix: true,
                  })}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {planting.quantityPlanted} {planting.quantityUnit}
              </TableCell>
              <TableCell className="text-sm">
                {planting.expectedHarvestDate
                  ? new Date(planting.expectedHarvestDate).toLocaleDateString('en-GB')
                  : '-'}
              </TableCell>
              <TableCell>
                <PlantingStatusBadge status={planting.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {planting.status === 'active' && (
                    <HarvestFormDialog planting={planting} onSuccess={onRefresh} />
                  )}

                  <PlantingFormDialog mode="edit" planting={planting} onSuccess={onRefresh} />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={deletingId === planting.id}>
                        {deletingId === planting.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="text-destructive h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Planting?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this planting record. Any associated harvest
                          records will remain but will be orphaned.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(planting.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

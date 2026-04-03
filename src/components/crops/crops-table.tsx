'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CropFormDialog } from './crop-form-dialog'
import { DeleteCropDialog } from './delete-crop-dialog'
import { formatDistanceToNow } from 'date-fns'

interface Crop {
  id: string
  name: string
  variety: string | null
  category: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

interface CropsTableProps {
  crops: Crop[]
  onRefresh: () => void
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    vegetable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    fruit: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    herb: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    grain: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export function CropsTable({ crops, onRefresh }: CropsTableProps) {
  if (crops.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold">No crops found</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            No crops match your current filters. Try adjusting your search or filters, or add your
            first crop to get started.
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
            <TableHead>Name</TableHead>
            <TableHead>Variety</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {crops.map((crop) => (
            <TableRow key={crop.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">{crop.name}</TableCell>
              <TableCell className="text-muted-foreground">{crop.variety || '-'}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={getCategoryColor(crop.category)}>
                  {crop.category}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">
                {crop.description || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(crop.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <CropFormDialog mode="edit" crop={crop} onSuccess={onRefresh} />
                  <DeleteCropDialog cropId={crop.id} cropName={crop.name} onSuccess={onRefresh} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

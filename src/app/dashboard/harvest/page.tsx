'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export default function HarvestPage() {
  const [harvests, setHarvests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHarvests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/harvest-logs')

      if (!response.ok) {
        throw new Error('Failed to fetch harvest logs')
      }

      const data = await response.json()
      setHarvests(data)
    } catch (err) {
      setError('Failed to load harvest records. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHarvests()
  }, [])

  if (isLoading && harvests.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Harvest Records</h1>
          <p className="text-muted-foreground">Track your harvests and stock</p>
        </div>
        <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const totalHarvests = harvests.length
  const totalStock = harvests.reduce((sum, h) => sum + parseFloat(h.currentStock || 0), 0)

  const getQualityColor = (grade: string | null) => {
    if (!grade) return 'bg-gray-100 text-gray-800'
    const colors: Record<string, string> = {
      Premium: 'bg-purple-100 text-purple-800',
      A: 'bg-green-100 text-green-800',
      B: 'bg-blue-100 text-blue-800',
      C: 'bg-yellow-100 text-yellow-800',
      Standard: 'bg-gray-100 text-gray-800',
    }
    return colors[grade] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Harvest Records</h1>
        <p className="text-muted-foreground">
          Track your harvests and stock levels{' '}
          {totalHarvests > 0 && (
            <span className="font-medium">
              ({totalHarvests} records, {totalStock.toFixed(2)} total stock)
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : harvests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">No harvest records yet</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Record a harvest from an active planting in the Planting Records page.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Crop</TableHead>
                <TableHead>Harvest Date</TableHead>
                <TableHead>Quantity Harvested</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {harvests.map((harvest) => (
                <TableRow key={harvest.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    {harvest.cropName}
                    {harvest.cropVariety && (
                      <span className="text-muted-foreground ml-1">- {harvest.cropVariety}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(harvest.harvestDate).toLocaleDateString()}
                    <span className="text-muted-foreground block text-xs">
                      {formatDistanceToNow(new Date(harvest.harvestDate), {
                        addSuffix: true,
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {harvest.quantityHarvested} {harvest.quantityUnit}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{harvest.currentStock}</span>{' '}
                    {harvest.quantityUnit}
                  </TableCell>
                  <TableCell>
                    {harvest.qualityGrade ? (
                      <Badge variant="secondary" className={getQualityColor(harvest.qualityGrade)}>
                        {harvest.qualityGrade}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                    {harvest.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

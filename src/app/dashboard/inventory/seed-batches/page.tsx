'use client'

import { useEffect, useState } from 'react'
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
import { SeedBatchFormDialog } from '@/components/inventory/seed-batch-form-dialog'

interface SeedBatch {
  id: string
  batchCode: string
  cropName: string
  cropVariety: string | null
  supplierName: string | null
  initialQuantity: string
  currentQuantity: string
  quantityUnit: string
  purchaseDate: string | null
  organicCertified: boolean
  notes: string | null
}

export default function SeedBatchesPage() {
  const [batches, setBatches] = useState<SeedBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/seed-batches')

      if (!response.ok) {
        throw new Error('Failed to fetch seed batches')
      }

      const data = await response.json()
      setBatches(data)
    } catch (err) {
      setError('Failed to load seed batches. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  const getStockStatus = (current: string, initial: string) => {
    const currentQty = parseFloat(current)
    const initialQty = parseFloat(initial)
    const percentage = (currentQty / initialQty) * 100

    if (currentQty === 0) {
      return { label: 'Depleted', color: 'bg-red-100 text-red-800', icon: '❌' }
    } else if (percentage < 10) {
      return { label: 'Critical', color: 'bg-red-100 text-red-800', icon: '⚠️' }
    } else if (percentage < 50) {
      return { label: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' }
    } else {
      return { label: 'Healthy', color: 'bg-green-100 text-green-800', icon: '✅' }
    }
  }

  if (isLoading && batches.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Seed Inventory</h1>
          <p className="text-muted-foreground">Manage seed batches and stock</p>
        </div>
        <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const totalBatches = batches.length
  const depletedBatches = batches.filter((b) => parseFloat(b.currentQuantity) === 0).length
  const lowStockBatches = batches.filter((b) => {
    const current = parseFloat(b.currentQuantity)
    const initial = parseFloat(b.initialQuantity)
    const percentage = (current / initial) * 100
    return current > 0 && percentage < 50
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seed Inventory</h1>
          <p className="text-muted-foreground">
            Track seed batches and stock levels{' '}
            {totalBatches > 0 && (
              <span className="font-medium">
                ({totalBatches} batches
                {lowStockBatches > 0 && `, ${lowStockBatches} low stock`}
                {depletedBatches > 0 && `, ${depletedBatches} depleted`})
              </span>
            )}
          </p>
        </div>
        <SeedBatchFormDialog onSuccess={fetchBatches} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">No seed batches yet</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Add your first seed batch to start tracking inventory and enable stock control for
              plantings.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Batch Code</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Initial Qty</TableHead>
                <TableHead className="text-right">Current Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Organic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const stockStatus = getStockStatus(batch.currentQuantity, batch.initialQuantity)
                return (
                  <TableRow key={batch.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm font-medium">
                      {batch.batchCode}
                    </TableCell>
                    <TableCell>
                      {batch.cropName}
                      {batch.cropVariety && (
                        <span className="text-muted-foreground ml-1">- {batch.cropVariety}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {batch.supplierName || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {batch.initialQuantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {batch.currentQuantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{batch.quantityUnit}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={stockStatus.color}>
                        <span className="mr-1">{stockStatus.icon}</span>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {batch.organicCertified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          🌱 Organic
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

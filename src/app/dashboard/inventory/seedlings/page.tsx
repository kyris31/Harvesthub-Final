'use client'

import { useEffect, useState } from 'react'
import { Loader2, ArrowUpDown } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SeedlingPurchaseFormDialog } from '@/components/inventory/seedling-purchase-form-dialog'

interface PurchasedSeedling {
  id: string
  cropName: string
  cropVariety: string | null
  supplierName: string | null
  quantityPurchased: string
  currentQuantity: string
  purchaseDate: string | null
  costPerSeedling: string | null
  totalCost: string | null
  notes: string | null
}

export default function PurchasedSeedlingsPage() {
  const [seedlings, setSeedlings] = useState<PurchasedSeedling[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('cropName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const fetchSeedlings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/purchased-seedlings')

      if (!response.ok) {
        throw new Error('Failed to fetch purchased seedlings')
      }

      const data = await response.json()
      setSeedlings(data)
    } catch (err) {
      setError('Failed to load seedlings. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSeedlings()
  }, [])

  const getStockStatus = (current: string, initial: string) => {
    const currentQty = parseFloat(current)
    const initialQty = parseFloat(initial)
    const percentage = (currentQty / initialQty) * 100

    if (currentQty === 0) {
      return { label: 'Used', color: 'bg-gray-100 text-gray-800', icon: '✓' }
    } else if (percentage < 50) {
      return { label: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' }
    } else {
      return { label: 'Available', color: 'bg-green-100 text-green-800', icon: '✅' }
    }
  }

  if (isLoading && seedlings.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Purchased Seedlings</h1>
          <p className="text-muted-foreground">Track seedling purchases and stock</p>
        </div>
        <div className="border-destructive bg-destructive/10 rounded-lg border p-6 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const filtered = seedlings
    .filter((s) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        s.cropName.toLowerCase().includes(q) ||
        (s.cropVariety?.toLowerCase().includes(q) ?? false) ||
        (s.supplierName?.toLowerCase().includes(q) ?? false)
      )
    })
    .sort((a, b) => {
      let valA: string
      let valB: string
      if (sortBy === 'purchaseDate') {
        valA = a.purchaseDate ?? ''
        valB = b.purchaseDate ?? ''
      } else {
        valA = a.cropName + (a.cropVariety ?? '')
        valB = b.cropName + (b.cropVariety ?? '')
      }
      const cmp = valA.localeCompare(valB)
      return sortOrder === 'desc' ? -cmp : cmp
    })

  const isDefault = sortBy === 'cropName' && sortOrder === 'asc'
  const sortOrderLabel =
    sortBy === 'purchaseDate'
      ? sortOrder === 'asc'
        ? 'Oldest'
        : 'Newest'
      : sortOrder === 'asc'
        ? 'A → Z'
        : 'Z → A'

  const totalPurchases = seedlings.length
  const usedUp = seedlings.filter((s) => parseFloat(s.currentQuantity) === 0).length
  const lowStock = seedlings.filter((s) => {
    const current = parseFloat(s.currentQuantity)
    const initial = parseFloat(s.quantityPurchased)
    const percentage = (current / initial) * 100
    return current > 0 && percentage < 50
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchased Seedlings</h1>
          <p className="text-muted-foreground">
            Track seedling purchases and availability{' '}
            {totalPurchases > 0 && (
              <span className="font-medium">
                ({totalPurchases} purchases
                {lowStock > 0 && `, ${lowStock} low stock`}
                {usedUp > 0 && `, ${usedUp} used up`})
              </span>
            )}
          </p>
        </div>
        <SeedlingPurchaseFormDialog onSuccess={fetchSeedlings} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by crop or supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cropName">Crop Name</SelectItem>
              <SelectItem value="purchaseDate">Purchase Date</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrderLabel}
          </Button>
          {!isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortBy('cropName')
                setSortOrder('asc')
              }}
              className="text-muted-foreground"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : seedlings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">No seedling purchases yet</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Record your first seedling purchase to track inventory and enable stock control for
              plantings.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Crop</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Purchased</TableHead>
                <TableHead className="text-right">Current Qty</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground py-10 text-center text-sm"
                  >
                    No seedlings match your search.
                  </TableCell>
                </TableRow>
              ) : null}
              {filtered.map((seedling) => {
                const stockStatus = getStockStatus(
                  seedling.currentQuantity,
                  seedling.quantityPurchased
                )
                return (
                  <TableRow key={seedling.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {seedling.cropName}
                      {seedling.cropVariety && (
                        <span className="text-muted-foreground ml-1">- {seedling.cropVariety}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {seedling.purchaseDate
                        ? new Date(seedling.purchaseDate).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {seedling.supplierName || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {seedling.quantityPurchased} seedlings
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {seedling.currentQuantity}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={stockStatus.color}>
                        <span className="mr-1">{stockStatus.icon}</span>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {seedling.totalCost ? `$${parseFloat(seedling.totalCost).toFixed(2)}` : '-'}
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

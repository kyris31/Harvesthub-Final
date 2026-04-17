'use client'

import { useEffect, useState } from 'react'
import { Loader2, ArrowUpDown, Trash2 } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { SeedlingPurchaseFormDialog } from '@/components/inventory/seedling-purchase-form-dialog'
import { SeedlingProductionFormDialog } from '@/components/inventory/seedling-production-form-dialog'
import { SeedlingProductionEditDialog } from '@/components/inventory/seedling-production-edit-dialog'
import { toast } from 'sonner'

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

interface ProductionLog {
  id: string
  sowingDate: string
  crop: { name: string; variety: string | null }
  seedBatch: { batchCode: string }
  quantitySown: string
  sowingUnit: string
  nurseryLocation: string | null
  actualSeedlingsProduced: number
  currentSeedlingsAvailable: number
  readyForTransplantDate: string | null
  notes: string | null
}

export default function SeedlingsPage() {
  const [purchased, setPurchased] = useState<PurchasedSeedling[]>([])
  const [production, setProduction] = useState<ProductionLog[]>([])
  const [isLoadingPurchased, setIsLoadingPurchased] = useState(true)
  const [isLoadingProduction, setIsLoadingProduction] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter/sort state — purchased
  const [searchP, setSearchP] = useState('')
  const [sortByP, setSortByP] = useState('cropName')
  const [sortOrderP, setSortOrderP] = useState<'asc' | 'desc'>('asc')

  // Filter/sort state — self-produced
  const [searchS, setSearchS] = useState('')
  const [sortByS, setSortByS] = useState('cropName')
  const [sortOrderS, setSortOrderS] = useState<'asc' | 'desc'>('asc')

  const fetchPurchased = async () => {
    try {
      setIsLoadingPurchased(true)
      const res = await fetch('/api/purchased-seedlings')
      if (!res.ok) throw new Error('Failed to fetch')
      setPurchased(await res.json())
    } catch {
      setError('Failed to load seedlings.')
    } finally {
      setIsLoadingPurchased(false)
    }
  }

  const fetchProduction = async () => {
    try {
      setIsLoadingProduction(true)
      const res = await fetch('/api/seedling-production')
      if (!res.ok) throw new Error('Failed to fetch')
      setProduction(await res.json())
    } catch {
      setError('Failed to load production logs.')
    } finally {
      setIsLoadingProduction(false)
    }
  }

  const deleteProductionRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/seedling-production/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Record deleted and seeds restored to batch')
      fetchProduction()
    } catch {
      toast.error('Failed to delete record')
    }
  }

  useEffect(() => {
    fetchPurchased()
    fetchProduction()
  }, [])

  // ── helpers ──────────────────────────────────────────────────────────────
  const getStockStatus = (current: string, initial: string) => {
    const cur = parseFloat(current)
    const ini = parseFloat(initial)
    const pct = (cur / ini) * 100
    if (cur === 0) return { label: 'Used', color: 'bg-gray-100 text-gray-800', icon: '✓' }
    if (pct < 50) return { label: 'Low', color: 'bg-yellow-100 text-yellow-800', icon: '⚠️' }
    return { label: 'Available', color: 'bg-green-100 text-green-800', icon: '✅' }
  }

  function sortAndFilter<
    T extends { cropName?: string; crop?: { name: string; variety: string | null } },
  >(
    items: T[],
    search: string,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    getSearchText: (item: T) => string,
    getSortVal: (item: T, key: string) => string
  ) {
    return items
      .filter((item) => {
        if (!search) return true
        return getSearchText(item).toLowerCase().includes(search.toLowerCase())
      })
      .sort((a, b) => {
        const cmp = getSortVal(a, sortBy).localeCompare(getSortVal(b, sortBy))
        return sortOrder === 'desc' ? -cmp : cmp
      })
  }

  const filteredPurchased = sortAndFilter(
    purchased,
    searchP,
    sortByP,
    sortOrderP,
    (s) => `${s.cropName} ${s.cropVariety ?? ''} ${s.supplierName ?? ''}`,
    (s, key) =>
      key === 'purchaseDate' ? (s.purchaseDate ?? '') : `${s.cropName}${s.cropVariety ?? ''}`
  )

  const filteredProduction = sortAndFilter(
    production,
    searchS,
    sortByS,
    sortOrderS,
    (p) => `${p.crop.name} ${p.crop.variety ?? ''} ${p.seedBatch.batchCode}`,
    (p, key) => (key === 'sowingDate' ? p.sowingDate : `${p.crop.name}${p.crop.variety ?? ''}`)
  )

  if (
    (isLoadingPurchased || isLoadingProduction) &&
    purchased.length === 0 &&
    production.length === 0
  ) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-2 h-5 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seedlings</h1>
        <p className="text-muted-foreground">Manage purchased and self-produced seedlings</p>
      </div>

      {error && (
        <div className="border-destructive bg-destructive/10 rounded-lg border p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <Tabs defaultValue="purchased">
        <TabsList>
          <TabsTrigger value="purchased">
            Purchased
            {purchased.length > 0 && (
              <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
                {purchased.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="self-produced">
            Self-Produced
            {production.length > 0 && (
              <span className="bg-muted ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
                {production.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── PURCHASED TAB ───────────────────────────────────── */}
        <TabsContent value="purchased" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {purchased.length} purchase{purchased.length !== 1 ? 's' : ''}
            </p>
            <SeedlingPurchaseFormDialog onSuccess={fetchPurchased} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by crop or supplier..."
              value={searchP}
              onChange={(e) => setSearchP(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sortByP} onValueChange={setSortByP}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cropName">Crop Name</SelectItem>
                  <SelectItem value="purchaseDate">Purchase Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrderP((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortByP === 'purchaseDate'
                  ? sortOrderP === 'asc'
                    ? 'Oldest'
                    : 'Newest'
                  : sortOrderP === 'asc'
                    ? 'A → Z'
                    : 'Z → A'}
              </Button>
              {(sortByP !== 'cropName' || sortOrderP !== 'asc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortByP('cropName')
                    setSortOrderP('asc')
                  }}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isLoadingPurchased ? (
            <div className="flex justify-center py-10">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : purchased.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-muted-foreground text-sm">No purchased seedlings yet.</p>
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
                  {filteredPurchased.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-muted-foreground py-10 text-center text-sm"
                      >
                        No seedlings match your search.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredPurchased.map((s) => {
                    const status = getStockStatus(s.currentQuantity, s.quantityPurchased)
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {s.cropName}
                          {s.cropVariety && (
                            <span className="text-muted-foreground ml-1">- {s.cropVariety}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.purchaseDate
                            ? new Date(s.purchaseDate).toLocaleDateString('en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.supplierName || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {s.quantityPurchased} seedlings
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {s.currentQuantity}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.color}>
                            <span className="mr-1">{status.icon}</span>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {s.totalCost ? `€${parseFloat(s.totalCost).toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ── SELF-PRODUCED TAB ───────────────────────────────── */}
        <TabsContent value="self-produced" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {production.length} sowing record{production.length !== 1 ? 's' : ''}
            </p>
            <SeedlingProductionFormDialog onSuccess={fetchProduction} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Search by crop or batch..."
              value={searchS}
              onChange={(e) => setSearchS(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-3">
              <Select value={sortByS} onValueChange={setSortByS}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cropName">Crop Name</SelectItem>
                  <SelectItem value="sowingDate">Sowing Date</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrderS((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortByS === 'sowingDate'
                  ? sortOrderS === 'asc'
                    ? 'Oldest'
                    : 'Newest'
                  : sortOrderS === 'asc'
                    ? 'A → Z'
                    : 'Z → A'}
              </Button>
              {(sortByS !== 'cropName' || sortOrderS !== 'asc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSortByS('cropName')
                    setSortOrderS('asc')
                  }}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isLoadingProduction ? (
            <div className="flex justify-center py-10">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : production.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-muted-foreground text-sm">
                No sowing records yet. Add your first sowing record.
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Sowing Date</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Variety</TableHead>
                    <TableHead>Seed Batch</TableHead>
                    <TableHead className="text-right">Seeds Sown</TableHead>
                    <TableHead>Nursery Loc.</TableHead>
                    <TableHead className="text-right">Seedlings Produced</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProduction.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-muted-foreground py-10 text-center text-sm"
                      >
                        No records match your search.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredProduction.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(p.sowingDate).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell className="font-medium">{p.crop.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.crop.variety ?? '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.seedBatch.batchCode}</TableCell>
                      <TableCell className="text-right">
                        {p.quantitySown} {p.sowingUnit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.nurseryLocation ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.actualSeedlingsProduced > 0 ? (
                          <span className="font-medium">{p.actualSeedlingsProduced}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.actualSeedlingsProduced > 0 ? (
                          <Badge
                            variant="secondary"
                            className={
                              p.currentSeedlingsAvailable === 0
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {p.currentSeedlingsAvailable}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SeedlingProductionEditDialog
                            record={{
                              id: p.id,
                              cropName: p.crop.name,
                              cropVariety: p.crop.variety,
                              sowingDate: p.sowingDate,
                              actualSeedlingsProduced: p.actualSeedlingsProduced,
                              currentSeedlingsAvailable: p.currentSeedlingsAvailable,
                              nurseryLocation: p.nurseryLocation,
                              readyForTransplantDate: p.readyForTransplantDate,
                              notes: p.notes,
                            }}
                            onSuccess={fetchProduction}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Sowing Record?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete the sowing record for{' '}
                                  <strong>
                                    {p.crop.name}
                                    {p.crop.variety ? ` (${p.crop.variety})` : ''}
                                  </strong>{' '}
                                  and restore{' '}
                                  <strong>
                                    {p.quantitySown} {p.sowingUnit}
                                  </strong>{' '}
                                  back to the seed batch.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteProductionRecord(p.id)}
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

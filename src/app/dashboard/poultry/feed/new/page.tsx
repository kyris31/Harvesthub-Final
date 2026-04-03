'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { createPoultryFeed } from '@/app/actions/poultry-feed'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'

// Feed type options — editable so user can type custom names too
const FEED_TYPE_SUGGESTIONS = [
  { value: 'starter', label: 'Starter (0–3 weeks)' },
  { value: 'grower', label: 'Grower (3–6 weeks)' },
  { value: 'finisher', label: 'Finisher (6+ weeks)' },
  { value: 'layer', label: 'Layer feed' },
  { value: 'whole_wheat', label: 'Whole wheat' },
  { value: 'corn', label: 'Corn / Maize' },
  { value: 'soybean', label: 'Soybean meal' },
  { value: 'limestone', label: 'Limestone / Calcium' },
  { value: 'supplement', label: 'Supplement / Premix' },
  { value: 'other', label: 'Other' },
]

interface FeedLine {
  id: number
  feedType: string
  brand: string
  quantity: string // number of bags OR kg
  unit: string // 'bags' | 'kg' | 'lbs'
  bagWeightKg: string // kg per bag (only used when unit = 'bags')
  costPerUnit: string // price per bag OR price per kg
  notes: string
}

function newLine(id: number): FeedLine {
  return {
    id,
    feedType: '',
    brand: '',
    quantity: '',
    unit: 'bags',
    bagWeightKg: '25',
    costPerUnit: '',
    notes: '',
  }
}

export default function AddFeedPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [invoiceRef, setInvoiceRef] = useState('')
  const [lines, setLines] = useState<FeedLine[]>([newLine(1)])
  const [nextId, setNextId] = useState(2)

  useEffect(() => {
    getSuppliersForSelect()
      .then(setSuppliers)
      .catch(() => {})
  }, [])

  function addLine() {
    setLines((prev) => [...prev, newLine(nextId)])
    setNextId((n) => n + 1)
  }

  function removeLine(id: number) {
    if (lines.length === 1) return // keep at least one
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  function updateLine(id: number, field: keyof FeedLine, value: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  // Total cost across all lines (bags × price/bag OR kg × price/kg)
  const grandTotal = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0
    const cost = parseFloat(l.costPerUnit) || 0
    return sum + qty * cost
  }, 0)

  // Total kg summary
  const grandTotalKg = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0
    if (l.unit === 'bags') {
      return sum + qty * (parseFloat(l.bagWeightKg) || 0)
    }
    return sum + qty
  }, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate: all lines need feedType and quantity
    const invalid = lines.filter((l) => !l.feedType || !l.quantity || parseFloat(l.quantity) <= 0)
    if (invalid.length > 0) {
      toast.error('Each line needs a feed type and quantity')
      return
    }

    setIsSubmitting(true)
    try {
      await Promise.all(
        lines.map((l) => {
          const qty = parseFloat(l.quantity)
          const costPerBag = parseFloat(l.costPerUnit) || undefined

          let totalKg: number
          let costPerKg: number | undefined

          if (l.unit === 'bags') {
            const kgPerBag = parseFloat(l.bagWeightKg) || 1
            totalKg = qty * kgPerBag
            costPerKg = costPerBag ? costPerBag / kgPerBag : undefined
          } else {
            totalKg = qty
            costPerKg = costPerBag
          }

          return createPoultryFeed({
            feedType: l.feedType,
            brand: l.brand || supplierName || undefined,
            description:
              l.unit === 'bags'
                ? `${qty} bags × ${l.bagWeightKg} kg/bag${l.notes ? '. ' + l.notes : ''}`
                : l.notes || undefined,
            purchaseDate,
            batchNumber: invoiceRef || undefined,
            initialQuantity: totalKg,
            currentQuantity: totalKg,
            quantityUnit: 'kg',
            costPerUnit: costPerKg,
            totalCost: costPerBag ? qty * costPerBag : undefined,
          })
        })
      )

      toast.success(`${lines.length} feed item${lines.length > 1 ? 's' : ''} added to inventory!`)
      router.push('/dashboard/poultry/feed')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add feed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/poultry/feed">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed Management
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Add Feed Purchase</h1>
        <p className="text-muted-foreground">
          Record one or more feed types from a single purchase or delivery
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Purchase Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  type="date"
                  id="purchaseDate"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
                <Select
                  value={supplierId}
                  onValueChange={(v) => {
                    setSupplierId(v)
                    setSupplierName(suppliers.find((s) => s.id === v)?.name ?? '')
                  }}
                >
                  <SelectTrigger id="supplierId">
                    <SelectValue placeholder="Select supplier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No suppliers added yet
                      </SelectItem>
                    ) : (
                      suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceRef">Invoice / Reference No.</Label>
                <Input
                  id="invoiceRef"
                  placeholder="e.g. INV-2026-001"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Items</CardTitle>
            <p className="text-muted-foreground text-sm">Add one row per feed type purchased</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table header */}
            <div className="text-muted-foreground hidden grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1.5fr_auto] gap-3 px-1 text-sm font-medium md:grid">
              <span>Feed Type *</span>
              <span>Brand</span>
              <span>Qty *</span>
              <span>Unit</span>
              <span>kg / bag</span>
              <span>Cost/bag or /kg (€)</span>
              <span>Line Total</span>
              <span></span>
            </div>

            {lines.map((line) => {
              const qty = parseFloat(line.quantity) || 0
              const cost = parseFloat(line.costPerUnit) || 0
              const lineTotal = qty * cost
              const totalKg = line.unit === 'bags' ? qty * (parseFloat(line.bagWeightKg) || 0) : qty

              return (
                <div
                  key={line.id}
                  className="bg-muted/20 grid items-start gap-3 rounded-lg border p-3 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1.5fr_auto]"
                >
                  {/* Feed Type */}
                  <div className="space-y-1">
                    <Label className="text-xs md:hidden">Feed Type *</Label>
                    <Select
                      value={line.feedType}
                      onValueChange={(v) => updateLine(line.id, 'feedType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FEED_TYPE_SUGGESTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand */}
                  <div className="space-y-1">
                    <Label className="text-xs md:hidden">Brand</Label>
                    <Input
                      placeholder={supplierName || 'Brand...'}
                      value={line.brand ?? ''}
                      onChange={(e) => updateLine(line.id, 'brand', e.target.value)}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Label className="text-xs md:hidden">
                      {line.unit === 'bags' ? 'No. of bags *' : 'Quantity (kg) *'}
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder={line.unit === 'bags' ? '10' : '200'}
                      value={line.quantity ?? ''}
                      onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-1">
                    <Label className="text-xs md:hidden">Unit</Label>
                    <Select value={line.unit} onValueChange={(v) => updateLine(line.id, 'unit', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bags">bags</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* kg per bag — only when unit = bags */}
                  <div className="space-y-1">
                    <Label className="text-xs md:hidden">kg / bag</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="25"
                      value={line.bagWeightKg ?? ''}
                      onChange={(e) => updateLine(line.id, 'bagWeightKg', e.target.value)}
                      disabled={line.unit !== 'bags'}
                      className={line.unit !== 'bags' ? 'opacity-30' : ''}
                    />
                  </div>

                  {/* Cost per bag or per kg */}
                  <div className="space-y-1">
                    <Label className="text-xs md:hidden">
                      {line.unit === 'bags' ? 'Price/bag (€)' : 'Cost/kg (€)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={line.unit === 'bags' ? '12.00' : '0.45'}
                      value={line.costPerUnit ?? ''}
                      onChange={(e) => updateLine(line.id, 'costPerUnit', e.target.value)}
                    />
                    {line.unit === 'bags' && line.costPerUnit && line.bagWeightKg && (
                      <p className="text-muted-foreground text-xs">
                        = €
                        {(parseFloat(line.costPerUnit) / parseFloat(line.bagWeightKg)).toFixed(3)}
                        /kg
                      </p>
                    )}
                  </div>

                  {/* Line total */}
                  <div className="space-y-1">
                    <div
                      className={`text-sm font-semibold ${lineTotal > 0 ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {lineTotal > 0 ? `€${lineTotal.toFixed(2)}` : '—'}
                    </div>
                    {line.unit === 'bags' && totalKg > 0 && (
                      <p className="text-muted-foreground text-xs">{totalKg.toFixed(0)} kg total</p>
                    )}
                  </div>

                  {/* Remove button */}
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length === 1}
                      title="Remove this line"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}

            <Button type="button" variant="outline" onClick={addLine} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Feed Type
            </Button>

            {/* Grand total */}
            {grandTotal > 0 && (
              <div className="flex justify-end border-t pt-2">
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Total Purchase Cost</p>
                  <p className="text-2xl font-bold">€{grandTotal.toFixed(2)}</p>
                  <p className="text-muted-foreground text-xs">
                    {lines.length} line item{lines.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Adding...'
              : `Add ${lines.length} Item${lines.length !== 1 ? 's' : ''} to Inventory`}
          </Button>
        </div>
      </form>
    </div>
  )
}

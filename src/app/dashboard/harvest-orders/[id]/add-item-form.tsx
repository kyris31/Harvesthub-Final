'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addOrderItem, deleteOrderItem } from '@/app/actions/harvest-orders'
import { Loader2, Save, Leaf, TreePine, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Customer {
  id: string
  name: string
  phone: string | null
}
interface ProductOption {
  id: string
  label: string
  productName: string
}

interface Props {
  orderId: string
  customers: Customer[]
  plantingOptions: ProductOption[]
  treeOptions: ProductOption[]
  // existing items so we can pre-fill cells
  existingItems: {
    id: string
    customerName: string
    productName: string
    quantityKg: string
    unit: string
    pricePerUnit: string | null
    totalPrice: string | null
  }[]
}

const UNITS = ['kg', 'bunches', 'pieces', 'boxes', 'crates']

export function OrderGrid({
  orderId,
  customers,
  plantingOptions,
  treeOptions,
  existingItems,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Customer column picker — pre-select those who have existing items
  const preselected = [
    ...new Set(
      existingItems.map((i) => customers.find((c) => c.name === i.customerName)?.id).filter(Boolean)
    ),
  ] as string[]
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(preselected)
  const selectedCustomers = customers.filter((c) => selectedCustomerIds.includes(c.id))
  const [pickerValue, setPickerValue] = useState('')

  function addCustomer(id: string) {
    if (!id || selectedCustomerIds.includes(id)) return
    setSelectedCustomerIds((prev) => [...prev, id])
    setPickerValue('')
  }
  function removeCustomer(id: string) {
    setSelectedCustomerIds((prev) => prev.filter((x) => x !== id))
  }

  // All products combined — plantings first, then trees
  const allProducts: (ProductOption & { type: 'planting' | 'tree' })[] = [
    ...plantingOptions.map((p) => ({ ...p, type: 'planting' as const })),
    ...treeOptions.map((t) => ({ ...t, type: 'tree' as const })),
  ]

  // Initialise grid state from existing items
  function buildInitialState() {
    // cells[productName][customerId] = qty string
    const cells: Record<string, Record<string, string>> = {}
    // prices[productName] = price string
    const prices: Record<string, string> = {}
    // units[productName] = unit string
    const units: Record<string, string> = {}

    for (const prod of allProducts) {
      cells[prod.productName] = {}
      units[prod.productName] = 'kg'
      prices[prod.productName] = ''
    }

    for (const item of existingItems) {
      const cust = customers.find((c) => c.name === item.customerName)
      if (cust && cells[item.productName] !== undefined) {
        cells[item.productName]![cust.id] = parseFloat(item.quantityKg).toString()
        if (item.pricePerUnit) prices[item.productName] = item.pricePerUnit
        units[item.productName] = item.unit
      }
    }
    return { cells, prices, units }
  }

  const initial = buildInitialState()
  const [cells, setCells] = useState<Record<string, Record<string, string>>>(initial.cells)
  const [prices, setPrices] = useState<Record<string, string>>(initial.prices)
  const [units, setUnits] = useState<Record<string, string>>(initial.units)

  function setCell(productName: string, customerId: string, value: string) {
    setCells((prev) => ({
      ...prev,
      [productName]: { ...prev[productName], [customerId]: value },
    }))
  }

  async function handleSave() {
    setError('')
    startTransition(async () => {
      try {
        // Delete all existing items for this order and re-insert
        const deleteOps = existingItems.map((item) => deleteOrderItem(item.id, orderId))
        await Promise.all(deleteOps)

        // Build insert operations from non-empty cells
        const inserts: Promise<unknown>[] = []
        for (const prod of allProducts) {
          const pName = prod.productName
          const priceVal = prices[pName] ? parseFloat(prices[pName]!) : null
          const unit = units[pName] ?? 'kg'
          for (const cust of selectedCustomers) {
            const qtyStr = cells[pName]?.[cust.id] ?? ''
            const qty = parseFloat(qtyStr)
            if (isNaN(qty) || qty <= 0) continue
            inserts.push(
              addOrderItem({
                orderId,
                customerId: cust.id,
                customerName: cust.name,
                productName: pName,
                quantityKg: qty,
                unit,
                pricePerUnit: priceVal,
              })
            )
          }
        }
        await Promise.all(inserts)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      } catch (e: any) {
        setError(e.message ?? 'Save failed')
      }
    })
  }

  if (allProducts.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          No active plantings or trees found. Add plantings in the Cultivation section first.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Order Entry Grid</CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Choose customers, set price/unit per product, fill quantities · Leave blank = no order
            </p>
          </div>
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saved ? 'Saved ✓' : 'Save All'}
          </Button>
        </div>

        {/* Customer picker */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Select value={pickerValue} onValueChange={addCustomer}>
              <SelectTrigger className="h-8 w-56 text-sm">
                <SelectValue placeholder="+ Add customer column…" />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .filter((c) => !selectedCustomerIds.includes(c.id))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedCustomers.length === 0 && (
              <span className="text-muted-foreground text-xs">
                Select at least one customer to show columns
              </span>
            )}
          </div>
          {selectedCustomers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedCustomers.map((c) => (
                <span
                  key={c.id}
                  className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {c.name}
                  <button
                    type="button"
                    onClick={() => removeCustomer(c.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && <p className="text-destructive px-4 pb-2 text-sm">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 border-b">
                {/* Product label col */}
                <th className="bg-muted/80 sticky left-0 z-10 min-w-[160px] border-r px-3 py-2.5 text-left font-semibold">
                  Product
                </th>
                {/* Unit col */}
                <th className="text-muted-foreground min-w-[90px] border-r px-2 py-2.5 text-center text-xs font-semibold">
                  Unit
                </th>
                {/* Price col */}
                <th className="text-muted-foreground min-w-[80px] border-r px-2 py-2.5 text-center text-xs font-semibold">
                  €/unit
                </th>
                {/* One column per selected customer */}
                {selectedCustomers.map((c) => (
                  <th
                    key={c.id}
                    className="min-w-[100px] px-2 py-2.5 text-center font-semibold whitespace-nowrap"
                  >
                    <div>{c.name}</div>
                    <div className="text-muted-foreground text-[10px] font-normal">Quantity</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ── Plantings section ── */}
              {plantingOptions.length > 0 && (
                <tr className="bg-green-50/60 dark:bg-green-950/20">
                  <td
                    colSpan={3 + selectedCustomers.length}
                    className="sticky left-0 border-b px-3 py-1.5 text-[10px] font-bold tracking-wider text-green-700 uppercase dark:text-green-400"
                  >
                    <Leaf className="mr-1 inline h-3 w-3" />
                    Active Plantings
                  </td>
                </tr>
              )}
              {plantingOptions.map((prod, i) => (
                <ProductRow
                  key={prod.id}
                  prod={{ ...prod, type: 'planting' }}
                  customers={selectedCustomers}
                  cells={cells[prod.productName] ?? {}}
                  unit={units[prod.productName] ?? 'kg'}
                  price={prices[prod.productName] ?? ''}
                  striped={i % 2 === 1}
                  onCell={(custId, val) => setCell(prod.productName, custId, val)}
                  onUnit={(val) => setUnits((p) => ({ ...p, [prod.productName]: val }))}
                  onPrice={(val) => setPrices((p) => ({ ...p, [prod.productName]: val }))}
                />
              ))}

              {/* ── Trees section ── */}
              {treeOptions.length > 0 && (
                <tr className="bg-amber-50/60 dark:bg-amber-950/20">
                  <td
                    colSpan={3 + selectedCustomers.length}
                    className="sticky left-0 border-t border-b px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:text-amber-400"
                  >
                    <TreePine className="mr-1 inline h-3 w-3" />
                    Trees
                  </td>
                </tr>
              )}
              {treeOptions.map((prod, i) => (
                <ProductRow
                  key={prod.id}
                  prod={{ ...prod, type: 'tree' }}
                  customers={selectedCustomers}
                  cells={cells[prod.productName] ?? {}}
                  unit={units[prod.productName] ?? 'kg'}
                  price={prices[prod.productName] ?? ''}
                  striped={i % 2 === 1}
                  onCell={(custId, val) => setCell(prod.productName, custId, val)}
                  onUnit={(val) => setUnits((p) => ({ ...p, [prod.productName]: val }))}
                  onPrice={(val) => setPrices((p) => ({ ...p, [prod.productName]: val }))}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Single product row ──────────────────────────────────────────────────────
function ProductRow({
  prod,
  customers,
  cells,
  unit,
  price,
  striped,
  onCell,
  onUnit,
  onPrice,
}: {
  prod: ProductOption & { type: 'planting' | 'tree' }
  customers: { id: string; name: string }[]
  cells: Record<string, string>
  unit: string
  price: string
  striped: boolean
  onCell: (custId: string, val: string) => void
  onUnit: (val: string) => void
  onPrice: (val: string) => void
}) {
  return (
    <tr className={`border-b ${striped ? 'bg-muted/20' : ''} hover:bg-muted/30 transition-colors`}>
      {/* Product name — sticky */}
      <td
        className={`sticky left-0 z-10 border-r px-3 py-1.5 text-xs font-medium whitespace-nowrap ${striped ? 'bg-muted/30' : 'bg-background'}`}
      >
        {prod.label}
      </td>

      {/* Unit select */}
      <td className="border-r px-2 py-1">
        <Select value={unit} onValueChange={onUnit}>
          <SelectTrigger className="h-7 w-full px-1.5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Price input */}
      <td className="border-r px-2 py-1">
        <Input
          className="h-7 w-full px-1.5 text-xs"
          type="number"
          step="0.10"
          min="0"
          placeholder="0.00"
          value={price}
          onChange={(e) => onPrice(e.target.value)}
        />
      </td>

      {/* Qty cell per customer */}
      {customers.map((c) => (
        <td key={c.id} className="px-2 py-1 text-center">
          <Input
            className="h-7 w-full px-1.5 text-center text-xs"
            type="number"
            step="0.5"
            min="0"
            placeholder="—"
            value={cells[c.id] ?? ''}
            onChange={(e) => onCell(c.id, e.target.value)}
          />
        </td>
      ))}
    </tr>
  )
}

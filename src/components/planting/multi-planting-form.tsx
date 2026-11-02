'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { plantingLogSchema, type PlantingLogFormData } from '@/lib/validations/planting'
import { createPlantingLogs } from '@/app/actions/planting'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MultiPlantingFormProps {
  crops: Array<{ id: string; name: string; variety: string | null }>
  plots: Array<{ id: string; name: string; areaSqm: string | null }>
  seedBatches: Array<{
    id: string
    cropId: string
    batchCode: string
    currentQuantity: string
    quantityUnit: string
    crop: { name: string; variety: string | null }
  }>
  selfProducedSeedlings: Array<{
    id: string
    cropId: string
    crop: { name: string; variety: string | null }
    productionDate: string | null
    currentSeedlingsAvailable: number | null
  }>
  purchasedSeedlings: Array<{
    id: string
    cropId: string
    crop: { name: string; variety: string | null }
    purchaseDate: string | null
    currentQuantity: number | null
  }>
}

type Source = 'direct_sow' | 'self_produced' | 'purchased'

interface Row {
  key: number
  cropId: string
  plantingSource: Source
  batchId: string
  plotId: string
  quantityPlanted: string
  quantityUnit: string
}

let nextKey = 1
const newRow = (init?: Partial<Row>): Row => ({
  key: nextKey++,
  cropId: '',
  plantingSource: 'direct_sow',
  batchId: '',
  plotId: '',
  quantityPlanted: '',
  quantityUnit: 'plants',
  ...init,
})

export function MultiPlantingForm({
  crops,
  plots,
  seedBatches,
  selfProducedSeedlings,
  purchasedSeedlings,
}: MultiPlantingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [rows, setRows] = useState<Row[]>([newRow()])
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('')
  const [status, setStatus] = useState<PlantingLogFormData['status']>('active')
  const [notes, setNotes] = useState('')

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  // Same crop + source + plot + unit as the previous row, so splitting one planting across
  // batches only needs a new batch and quantity.
  const addRow = (copyFrom?: Row) =>
    setRows((prev) => [
      ...prev,
      copyFrom
        ? newRow({
            cropId: copyFrom.cropId,
            plantingSource: copyFrom.plantingSource,
            plotId: copyFrom.plotId,
            quantityUnit: copyFrom.quantityUnit,
          })
        : newRow(),
    ])

  // Cap this row at the batch's available stock and move the remainder to a new row right
  // after it, preselecting another batch of the same crop that no row is using yet.
  function splitRemainder(row: Row, available: number) {
    const remainder = parseFloat(row.quantityPlanted) - available
    const used = new Set(rows.map((r) => r.batchId))
    const nextBatch = seedBatches.find((b) => b.cropId === row.cropId && !used.has(b.id))
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.key === row.key)
      const capped = prev.map((r) =>
        r.key === row.key ? { ...r, quantityPlanted: String(available) } : r
      )
      capped.splice(
        idx + 1,
        0,
        newRow({
          cropId: row.cropId,
          plantingSource: row.plantingSource,
          plotId: row.plotId,
          quantityUnit: row.quantityUnit,
          batchId: nextBatch?.id ?? '',
          quantityPlanted: String(Math.round(remainder * 100) / 100),
        })
      )
      return capped
    })
  }

  const removeRow = (key: number) => setRows((prev) => prev.filter((r) => r.key !== key))

  function toFormData(row: Row): PlantingLogFormData {
    return {
      cropId: row.cropId,
      plotId: row.plotId,
      plantingSource: row.plantingSource,
      seedBatchId: row.plantingSource === 'direct_sow' ? row.batchId : '',
      selfProducedSeedlingId: row.plantingSource === 'self_produced' ? row.batchId : '',
      purchasedSeedlingId: row.plantingSource === 'purchased' ? row.batchId : '',
      plantingDate,
      quantityPlanted: row.quantityPlanted,
      quantityUnit: row.quantityUnit,
      expectedHarvestDate,
      status,
      notes,
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()

    const items: PlantingLogFormData[] = []
    for (let i = 0; i < rows.length; i++) {
      const data = toFormData(rows[i]!)
      const parsed = plantingLogSchema.safeParse(data)
      if (!parsed.success) {
        toast({
          title: `Planting ${i + 1} is incomplete`,
          description: parsed.error.issues[0]?.message ?? 'Please check the fields',
          variant: 'destructive',
        })
        return
      }
      if (data.plantingSource === 'direct_sow' && !data.seedBatchId) {
        toast({
          title: `Planting ${i + 1} is incomplete`,
          description: 'Please select a seed batch',
          variant: 'destructive',
        })
        return
      }
      if (!(parseFloat(data.quantityPlanted) > 0)) {
        toast({
          title: `Planting ${i + 1} is incomplete`,
          description: 'Quantity must be greater than 0',
          variant: 'destructive',
        })
        return
      }
      items.push(parsed.data)
    }

    setIsLoading(true)
    try {
      await createPlantingLogs(items)
      toast({
        title: items.length === 1 ? 'Planting created' : 'Plantings created',
        description: `${items.length} planting${items.length === 1 ? '' : 's'} added successfully.`,
      })
      router.push('/dashboard/planting')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Quantity other cards in this form already take from the same batch.
  const usedElsewhere = (row: Row, batchId: string) =>
    rows
      .filter((r) => r.key !== row.key && r.plantingSource === row.plantingSource)
      .filter((r) => r.batchId === batchId)
      .reduce((sum, r) => sum + (parseFloat(r.quantityPlanted) || 0), 0)

  const fmt = (n: number) => String(Math.round(n * 100) / 100)

  function batchOptions(row: Row): Array<{ id: string; label: string }> {
    if (row.plantingSource === 'direct_sow') {
      return seedBatches
        .filter((b) => b.cropId === row.cropId)
        .map((b) => ({
          id: b.id,
          label: `${b.crop.name}${b.crop.variety ? ` - ${b.crop.variety}` : ''} (Batch: ${b.batchCode}) — Avail: ${fmt(parseFloat(b.currentQuantity) - usedElsewhere(row, b.id))} ${b.quantityUnit}`,
        }))
    }
    if (row.plantingSource === 'self_produced') {
      return selfProducedSeedlings
        .filter((s) => s.cropId === row.cropId)
        .map((s) => ({
          id: s.id,
          label: `${s.crop.name}${s.crop.variety ? ` - ${s.crop.variety}` : ''} — Sown: ${s.productionDate || 'No date'} (Avail: ${fmt((s.currentSeedlingsAvailable ?? 0) - usedElsewhere(row, s.id))})`,
        }))
    }
    return purchasedSeedlings
      .filter((s) => s.cropId === row.cropId)
      .map((s) => ({
        id: s.id,
        label: `${s.crop.name}${s.crop.variety ? ` - ${s.crop.variety}` : ''} — Purchased: ${s.purchaseDate || 'No date'} (Avail: ${fmt((s.currentQuantity ?? 0) - usedElsewhere(row, s.id))})`,
      }))
  }

  const batchLabel: Record<Source, string> = {
    direct_sow: 'Seed Batch *',
    self_produced: 'Self-Produced Seedling Batch *',
    purchased: 'Purchased Seedling Batch *',
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Add one planting per crop and batch. To plant one crop from several batches, add another
        planting for the same crop and pick a different batch.
      </p>

      {rows.map((row, index) => {
        const options = batchOptions(row)
        const selectedSeedBatch =
          row.plantingSource === 'direct_sow'
            ? seedBatches.find((b) => b.id === row.batchId)
            : undefined
        const available = selectedSeedBatch
          ? parseFloat(selectedSeedBatch.currentQuantity) - usedElsewhere(row, selectedSeedBatch.id)
          : 0
        const overStock =
          !!selectedSeedBatch && parseFloat(row.quantityPlanted) > available && available >= 0
        return (
          <div key={row.key} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Planting {index + 1}</h3>
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(row.key)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Crop *</Label>
              <Select
                value={row.cropId || undefined}
                onValueChange={(value) => updateRow(row.key, { cropId: value, batchId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a crop" />
                </SelectTrigger>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name} {crop.variety && `(${crop.variety})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Planting Source *</Label>
              <RadioGroup
                value={row.plantingSource}
                onValueChange={(value) =>
                  updateRow(row.key, { plantingSource: value as Source, batchId: '' })
                }
                className="flex flex-col space-y-1"
              >
                {(
                  [
                    ['direct_sow', 'Direct Sow (from Seed Batch)'],
                    ['self_produced', 'Transplant (Self-Produced)'],
                    ['purchased', 'Transplant (Purchased Batch)'],
                  ] as const
                ).map(([value, label]) => (
                  <div key={value} className="flex items-center space-y-0 space-x-3">
                    <RadioGroupItem value={value} id={`${value}-${row.key}`} />
                    <Label htmlFor={`${value}-${row.key}`} className="cursor-pointer font-normal">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{batchLabel[row.plantingSource]}</Label>
              <Select
                value={row.batchId || undefined}
                onValueChange={(value) => updateRow(row.key, { batchId: value })}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !row.cropId
                        ? 'Select a crop first'
                        : options.length === 0
                          ? 'No batches available for this crop'
                          : 'Select a batch'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Plot (Optional)</Label>
              <Select
                value={row.plotId || undefined}
                onValueChange={(value) => updateRow(row.key, { plotId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plot (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {plots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      {plot.name} {plot.areaSqm && `(${plot.areaSqm} m²)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  placeholder="e.g. 30"
                  value={row.quantityPlanted}
                  onChange={(e) => updateRow(row.key, { quantityPlanted: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select
                  value={row.quantityUnit}
                  onValueChange={(value) => updateRow(row.key, { quantityUnit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plants">Plants</SelectItem>
                    <SelectItem value="seeds">Seeds</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {overStock && selectedSeedBatch && (
              <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p>
                  This batch only has {available} {selectedSeedBatch.quantityUnit} available. Plant{' '}
                  {available} here and the remaining{' '}
                  {Math.round((parseFloat(row.quantityPlanted) - available) * 100) / 100} from
                  another batch?
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => splitRemainder(row, available)}
                >
                  Split remainder to another batch
                </Button>
              </div>
            )}
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => addRow(rows[rows.length - 1])}
          disabled={isLoading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add another batch (same crop)
        </Button>
        <Button type="button" variant="outline" onClick={() => addRow()} disabled={isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          Add another crop
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Planting Date *</Label>
        <Input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} />
        <p className="text-muted-foreground text-sm">Applies to all plantings above</p>
      </div>

      <div className="space-y-2">
        <Label>Expected Harvest Date</Label>
        <Input
          type="date"
          value={expectedHarvestDate}
          onChange={(e) => setExpectedHarvestDate(e.target.value)}
        />
        <p className="text-muted-foreground text-sm">Optional, applies to all plantings above</p>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as PlantingLogFormData['status'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="harvested">Harvested</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Add any notes about these plantings..."
          className="resize-none"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {rows.length === 1 ? 'Create Planting' : `Create ${rows.length} Plantings`}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

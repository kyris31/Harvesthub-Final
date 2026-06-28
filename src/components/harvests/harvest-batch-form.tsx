'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { harvestBatchSchema, type HarvestBatchFormData } from '@/lib/validations/harvest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createHarvestLogsBatch } from '@/app/actions/harvests'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'

interface HarvestBatchFormProps {
  plantings: Array<{
    id: string
    plantingDate: string
    crop: { name: string; variety: string | null }
    plot: { name: string } | null
  }>
  trees: Array<{
    id: string
    identifier: string
    species: string
    variety: string | null
  }>
}

export function HarvestBatchForm({ plantings, trees }: HarvestBatchFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<HarvestBatchFormData>({
    resolver: formResolver<HarvestBatchFormData>(harvestBatchSchema),
    defaultValues: {
      harvestDate: new Date().toISOString().slice(0, 10),
      notes: '',
      items: [
        {
          sourceType: 'planting',
          plantingLogId: '',
          treeId: '',
          quantityHarvested: '',
          quantityUnit: 'kg',
          qualityGrade: '',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })

  const sortedPlantings = useMemo(
    () =>
      [...plantings].sort((a, b) =>
        a.crop.name.localeCompare(b.crop.name, undefined, { sensitivity: 'base' })
      ),
    [plantings]
  )

  const treeSpeciesGroups = useMemo(() => {
    const groups = new Map<string, { label: string; representativeId: string; count: number }>()
    for (const t of trees) {
      const key = t.variety ? `${t.species}||${t.variety}` : t.species
      const label = t.variety ? `${t.species} (${t.variety})` : t.species
      if (!groups.has(key)) {
        groups.set(key, { label, representativeId: t.id, count: 1 })
      } else {
        groups.get(key)!.count++
      }
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    )
  }, [trees])

  async function onSubmit(data: HarvestBatchFormData) {
    setIsLoading(true)
    try {
      const created = await createHarvestLogsBatch(data)
      toast({
        title: 'Harvest recorded',
        description: `${created.length} ${created.length === 1 ? 'item' : 'items'} recorded.`,
      })
      router.push('/dashboard/harvests')
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Shared harvest date */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Harvest Date *</label>
        <Input type="date" {...form.register('harvestDate')} />
        {form.formState.errors.harvestDate && (
          <p className="text-destructive text-sm">{form.formState.errors.harvestDate.message}</p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Items Harvested *</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                sourceType: 'planting',
                plantingLogId: '',
                treeId: '',
                quantityHarvested: '',
                quantityUnit: 'kg',
                qualityGrade: '',
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {fields.map((field, index) => {
          const sourceType = form.watch(`items.${index}.sourceType`)
          const itemError = form.formState.errors.items?.[index]
          return (
            <Card key={field.id} className="border-dashed">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium">Item #{index + 1}</span>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Source toggle */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={sourceType === 'planting' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      form.setValue(`items.${index}.sourceType`, 'planting')
                      form.setValue(`items.${index}.treeId`, '')
                    }}
                  >
                    🌱 From Planting
                  </Button>
                  <Button
                    type="button"
                    variant={sourceType === 'tree' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      form.setValue(`items.${index}.sourceType`, 'tree')
                      form.setValue(`items.${index}.plantingLogId`, '')
                    }}
                  >
                    🌳 From Tree
                  </Button>
                </div>

                {/* Planting / Tree select */}
                {sourceType === 'planting' ? (
                  <Select
                    value={form.watch(`items.${index}.plantingLogId`) || undefined}
                    onValueChange={(v) => form.setValue(`items.${index}.plantingLogId`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a planting to harvest" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedPlantings.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No active plantings
                        </SelectItem>
                      ) : (
                        sortedPlantings.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.crop.name}
                            {p.crop.variety && ` (${p.crop.variety})`} — Planted{' '}
                            {new Date(p.plantingDate).toLocaleDateString('en-GB')}
                            {p.plot && ` in ${p.plot.name}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    value={form.watch(`items.${index}.treeId`) || undefined}
                    onValueChange={(v) => form.setValue(`items.${index}.treeId`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tree to harvest" />
                    </SelectTrigger>
                    <SelectContent>
                      {treeSpeciesGroups.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No trees registered
                        </SelectItem>
                      ) : (
                        treeSpeciesGroups.map((g) => (
                          <SelectItem key={g.representativeId} value={g.representativeId}>
                            {g.label} — {g.count} {g.count === 1 ? 'tree' : 'trees'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
                {itemError?.plantingLogId && (
                  <p className="text-destructive text-sm">{itemError.plantingLogId.message}</p>
                )}

                {/* Quantity / Unit / Quality */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Quantity *</label>
                    <Input
                      placeholder="e.g. 50"
                      {...form.register(`items.${index}.quantityHarvested`)}
                    />
                    {itemError?.quantityHarvested && (
                      <p className="text-destructive text-xs">
                        {itemError.quantityHarvested.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Unit *</label>
                    <Select
                      value={form.watch(`items.${index}.quantityUnit`) || undefined}
                      onValueChange={(v) => form.setValue(`items.${index}.quantityUnit`, v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                        <SelectItem value="bunches">Bunches</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="crates">Crates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Quality</label>
                    <Input
                      placeholder="e.g. A, Premium"
                      {...form.register(`items.${index}.qualityGrade`)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {typeof form.formState.errors.items?.message === 'string' && (
          <p className="text-destructive text-sm">{form.formState.errors.items.message}</p>
        )}
      </div>

      {/* Shared notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <Textarea
          placeholder="Add any notes about this harvest..."
          className="resize-none"
          rows={3}
          {...form.register('notes')}
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Harvest
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

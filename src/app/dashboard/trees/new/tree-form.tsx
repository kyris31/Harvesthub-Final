'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createTrees } from '@/app/actions/trees'
import { Loader2, TreePine, Plus, Trash2 } from 'lucide-react'

const YIELD_UNITS = ['kg', 'tons', 'pieces', 'boxes', 'crates', 'liters']

interface Plot {
  id: string
  name: string
}

interface TreeRow {
  species: string
  variety: string
  quantity: string
  estimatedAnnualYield: string
  yieldUnit: string
}

function parseIdNum(id: string): number {
  const m = id.match(/^T-(\d+)$/i)
  return m ? parseInt(m[1], 10) : 0
}

export function NewTreeForm({
  plots,
  defaultIdentifier,
}: {
  plots: Plot[]
  defaultIdentifier?: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [rows, setRows] = useState<TreeRow[]>([
    {
      species: '',
      variety: '',
      quantity: '1',
      estimatedAnnualYield: '',
      yieldUnit: 'kg',
    },
  ])

  // Shared fields
  const [plotId, setPlotId] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [status, setStatus] = useState('healthy')
  const [healthNotes, setHealthNotes] = useState('')
  const [notes, setNotes] = useState('')

  function addRow() {
    setRows((prev) => [
      ...prev,
      { species: '', variety: '', quantity: '1', estimatedAnnualYield: '', yieldUnit: 'kg' },
    ])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof TreeRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (rows.some((r) => !r.species.trim())) {
      setError('All rows must have a species.')
      return
    }

    startTransition(async () => {
      try {
        // Expand each group row into N individual tree records with sequential IDs
        const startNum = parseIdNum(defaultIdentifier ?? 'T-000')
        let nextNum = startNum
        const treeList: Parameters<typeof createTrees>[0] = []

        for (const r of rows) {
          const qty = Math.max(1, parseInt(r.quantity || '1', 10))
          for (let i = 0; i < qty; i++) {
            nextNum += 1
            treeList.push({
              identifier: `T-${String(nextNum).padStart(3, '0')}`,
              species: r.species.trim(),
              variety: r.variety?.trim() || undefined,
              estimatedAnnualYield: r.estimatedAnnualYield
                ? parseFloat(r.estimatedAnnualYield)
                : undefined,
              yieldUnit: r.yieldUnit || undefined,
              plantingDate: plantingDate || undefined,
              plotId: plotId || undefined,
              locationDescription: locationDescription?.trim() || undefined,
              status: status || 'healthy',
              healthNotes: healthNotes?.trim() || undefined,
              notes: notes?.trim() || undefined,
            })
          }
        }

        await createTrees(treeList)
        router.push('/dashboard/trees')
        router.refresh()
      } catch (e: any) {
        setError(e.message ?? 'Failed to save trees')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* Dynamic tree rows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">🌳 Trees to Register</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-1 h-4 w-4" />
            Add Tree
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row, index) => (
            <div key={index} className="relative grid gap-3 rounded-md border p-4 md:grid-cols-2">
              {rows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              <div className="space-y-1.5">
                <Label>Species *</Label>
                <Input
                  value={row.species}
                  onChange={(e) => updateRow(index, 'species', e.target.value)}
                  required
                  placeholder="e.g. Lemon, Olive, Almond"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Variety</Label>
                <Input
                  value={row.variety}
                  onChange={(e) => updateRow(index, 'variety', e.target.value)}
                  placeholder="e.g. Eureka, Koroneiki"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                  placeholder="1"
                />
                <p className="text-muted-foreground text-xs">
                  Number of trees — IDs are auto-generated
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Est. Annual Yield (per tree)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={row.estimatedAnnualYield}
                    onChange={(e) => updateRow(index, 'estimatedAnnualYield', e.target.value)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <Select
                    value={row.yieldUnit}
                    onValueChange={(v) => updateRow(index, 'yieldUnit', v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YIELD_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shared location — applies to all trees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📍 Location</CardTitle>
          <p className="text-muted-foreground text-xs">Applies to all trees above</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {plots.length > 0 && (
            <div className="space-y-1.5">
              <Label>Plot</Label>
              <Select value={plotId} onValueChange={setPlotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plot (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {plots.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Planting Date</Label>
            <Input
              type="date"
              value={plantingDate}
              onChange={(e) => setPlantingDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Location Description</Label>
            <Input
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g. North field, row 3, position 5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shared health & notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💚 Health & Notes</CardTitle>
          <p className="text-muted-foreground text-xs">Applies to all trees above</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">✅ Healthy</SelectItem>
                <SelectItem value="sick">⚠️ Sick</SelectItem>
                <SelectItem value="dead">💀 Dead</SelectItem>
                <SelectItem value="removed">🗑️ Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Health Notes</Label>
            <Textarea
              rows={2}
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              placeholder="Any health observations…"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about these trees…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TreePine className="mr-2 h-4 w-4" />
          )}
          {isPending
            ? 'Saving…'
            : (() => {
                const total = rows.reduce(
                  (s, r) => s + Math.max(1, parseInt(r.quantity || '1', 10)),
                  0
                )
                return total > 1 ? `Register ${total} Trees` : 'Register Tree'
              })()}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

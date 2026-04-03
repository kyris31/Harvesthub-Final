'use client'

import { useState } from 'react'
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
import { ArrowLeft } from 'lucide-react'
import { createCropPlan } from '@/app/actions/planning'

interface Season {
  id: string
  name: string
}
interface Crop {
  id: string
  name: string
  variety: string | null
}
interface Plot {
  id: string
  name: string
}

interface Props {
  seasons: Season[]
  crops: Crop[]
  plots: Plot[]
  defaultSeasonId?: string
}

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const UNIT_OPTIONS = ['kg', 'pieces', 'bunches', 'crates', 'bags', 'tonnes', 'lbs']

export function NewCropPlanForm({ seasons, crops, plots, defaultSeasonId }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    seasonId: defaultSeasonId ?? '',
    cropId: '',
    plotId: '',
    plannedPlantingDate: '',
    plannedHarvestDate: '',
    targetQuantity: '',
    targetUnit: 'kg',
    estimatedCost: '',
    status: 'planned',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cropId) {
      toast.error('Please select a crop')
      return
    }
    if (
      form.plannedHarvestDate &&
      form.plannedPlantingDate &&
      form.plannedHarvestDate <= form.plannedPlantingDate
    ) {
      toast.error('Harvest date must be after planting date')
      return
    }

    setIsSubmitting(true)
    try {
      await createCropPlan({
        ...form,
        seasonId: form.seasonId && form.seasonId !== '__none' ? form.seasonId : null,
        plotId: form.plotId && form.plotId !== '__none' ? form.plotId : null,
        plannedPlantingDate: form.plannedPlantingDate || null,
        plannedHarvestDate: form.plannedHarvestDate || null,
        targetQuantity: form.targetQuantity ? parseFloat(form.targetQuantity) : null,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
      })
      toast.success('Crop plan added!')
      router.push('/dashboard/planning')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/planning">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Planning
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Add Crop Plan</h1>
        <p className="text-muted-foreground">Plan what to grow, where, and when</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Crop */}
              <div className="space-y-2">
                <Label htmlFor="cropId">Crop *</Label>
                <Select value={form.cropId} onValueChange={(v) => set('cropId', v)}>
                  <SelectTrigger id="cropId">
                    <SelectValue placeholder="Select crop..." />
                  </SelectTrigger>
                  <SelectContent>
                    {crops.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No crops — add from Crops section
                      </SelectItem>
                    ) : (
                      crops.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                          {c.variety ? ` (${c.variety})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Plot */}
              <div className="space-y-2">
                <Label htmlFor="plotId">Plot / Field</Label>
                <Select value={form.plotId} onValueChange={(v) => set('plotId', v)}>
                  <SelectTrigger id="plotId">
                    <SelectValue placeholder="Select plot (optional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">— No plot —</SelectItem>
                    {plots.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Season */}
            <div className="space-y-2">
              <Label htmlFor="seasonId">Season</Label>
              <Select value={form.seasonId} onValueChange={(v) => set('seasonId', v)}>
                <SelectTrigger id="seasonId">
                  <SelectValue placeholder="Link to a season (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— No season —</SelectItem>
                  {seasons.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plannedPlantingDate">Planned Planting Date</Label>
                <Input
                  type="date"
                  id="plannedPlantingDate"
                  value={form.plannedPlantingDate}
                  onChange={(e) => set('plannedPlantingDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedHarvestDate">Planned Harvest Date</Label>
                <Input
                  type="date"
                  id="plannedHarvestDate"
                  value={form.plannedHarvestDate}
                  onChange={(e) => set('plannedHarvestDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target & Cost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="targetQuantity">Target Quantity</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  id="targetQuantity"
                  placeholder="e.g. 500"
                  value={form.targetQuantity}
                  onChange={(e) => set('targetQuantity', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUnit">Unit</Label>
                <Select value={form.targetUnit} onValueChange={(v) => set('targetUnit', v)}>
                  <SelectTrigger id="targetUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  id="estimatedCost"
                  placeholder="e.g. 150.00"
                  value={form.estimatedCost}
                  onChange={(e) => set('estimatedCost', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="e.g. Early variety, use plot A first..."
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add Crop Plan'}
          </Button>
        </div>
      </form>
    </div>
  )
}

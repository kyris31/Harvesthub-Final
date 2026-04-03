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
import { updateTree } from '@/app/actions/trees'
import { Loader2, Save } from 'lucide-react'

const YIELD_UNITS = ['kg', 'tons', 'pieces', 'boxes', 'crates', 'liters']

interface Plot {
  id: string
  name: string
}

interface Tree {
  id: string
  identifier: string
  species: string
  variety: string | null
  plantingDate: string | null
  plotId: string | null
  locationDescription: string | null
  status: string | null
  healthNotes: string | null
  lastHarvestDate: string | null
  estimatedAnnualYield: string | null
  yieldUnit: string | null
  notes: string | null
}

export function EditTreeForm({ tree, plots }: { tree: Tree; plots: Plot[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const yieldVal = fd.get('estimatedAnnualYield') as string
    const plotId = fd.get('plotId') as string

    startTransition(async () => {
      try {
        await updateTree(tree.id, {
          identifier: (fd.get('identifier') as string).trim(),
          species: (fd.get('species') as string).trim(),
          variety: (fd.get('variety') as string)?.trim() || undefined,
          plantingDate: (fd.get('plantingDate') as string) || undefined,
          plotId: plotId || null,
          locationDescription: (fd.get('locationDescription') as string)?.trim() || undefined,
          status: (fd.get('status') as string) || 'healthy',
          healthNotes: (fd.get('healthNotes') as string)?.trim() || undefined,
          lastHarvestDate: (fd.get('lastHarvestDate') as string) || undefined,
          estimatedAnnualYield: yieldVal ? parseFloat(yieldVal) : undefined,
          yieldUnit: (fd.get('yieldUnit') as string) || undefined,
          notes: (fd.get('notes') as string)?.trim() || undefined,
        })
        router.push(`/dashboard/trees/${tree.id}`)
        router.refresh()
      } catch (e: any) {
        setError(e.message ?? 'Failed to update')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && <p className="text-destructive text-sm">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">🌳 Tree Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Tree ID / Code *</Label>
            <Input id="identifier" name="identifier" required defaultValue={tree.identifier} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="species">Species *</Label>
            <Input id="species" name="species" required defaultValue={tree.species} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variety">Variety</Label>
            <Input id="variety" name="variety" defaultValue={tree.variety ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plantingDate">Planting Date</Label>
            <Input
              id="plantingDate"
              name="plantingDate"
              type="date"
              defaultValue={tree.plantingDate ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📍 Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {plots.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="plotId">Plot</Label>
              <Select name="plotId" defaultValue={tree.plotId ?? ''}>
                <SelectTrigger id="plotId">
                  <SelectValue placeholder="Select plot (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No plot</SelectItem>
                  {plots.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="locationDescription">Location Description</Label>
            <Input
              id="locationDescription"
              name="locationDescription"
              defaultValue={tree.locationDescription ?? ''}
              placeholder="e.g. North field, row 3"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">💚 Health & Yield</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={tree.status ?? 'healthy'}>
              <SelectTrigger id="status">
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
          <div className="space-y-1.5">
            <Label htmlFor="lastHarvestDate">Last Harvest Date</Label>
            <Input
              id="lastHarvestDate"
              name="lastHarvestDate"
              type="date"
              defaultValue={tree.lastHarvestDate ?? ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimatedAnnualYield">Est. Annual Yield</Label>
            <div className="flex gap-2">
              <Input
                id="estimatedAnnualYield"
                name="estimatedAnnualYield"
                type="number"
                step="0.1"
                min="0"
                defaultValue={tree.estimatedAnnualYield ?? ''}
                className="flex-1"
              />
              <Select name="yieldUnit" defaultValue={tree.yieldUnit ?? 'kg'}>
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
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="healthNotes">Health Notes</Label>
            <Textarea
              id="healthNotes"
              name="healthNotes"
              rows={2}
              defaultValue={tree.healthNotes ?? ''}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📝 Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="notes" name="notes" rows={3} defaultValue={tree.notes ?? ''} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

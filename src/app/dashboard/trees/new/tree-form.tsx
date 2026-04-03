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
import { createTree } from '@/app/actions/trees'
import { Loader2, TreePine } from 'lucide-react'

const YIELD_UNITS = ['kg', 'tons', 'pieces', 'boxes', 'crates', 'liters']

interface Plot {
  id: string
  name: string
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const fd = new FormData(form)

    const yieldVal = fd.get('estimatedAnnualYield') as string
    const plotId = fd.get('plotId') as string

    startTransition(async () => {
      try {
        await createTree({
          identifier: (fd.get('identifier') as string).trim(),
          species: (fd.get('species') as string).trim(),
          variety: (fd.get('variety') as string)?.trim() || undefined,
          plantingDate: (fd.get('plantingDate') as string) || undefined,
          plotId: plotId || undefined,
          locationDescription: (fd.get('locationDescription') as string)?.trim() || undefined,
          status: (fd.get('status') as string) || 'healthy',
          healthNotes: (fd.get('healthNotes') as string)?.trim() || undefined,
          estimatedAnnualYield: yieldVal ? parseFloat(yieldVal) : undefined,
          yieldUnit: (fd.get('yieldUnit') as string) || undefined,
          notes: (fd.get('notes') as string)?.trim() || undefined,
        })
        router.push('/dashboard/trees')
        router.refresh()
      } catch (e: any) {
        setError(e.message ?? 'Failed to save tree')
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
            <Input
              id="identifier"
              name="identifier"
              required
              defaultValue={defaultIdentifier}
              placeholder="e.g. T-001, Olive-North-1"
            />
            <p className="text-muted-foreground text-xs">
              Auto-generated — you can change it if needed
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="species">Species *</Label>
            <Input id="species" name="species" required placeholder="e.g. Olive, Lemon, Almond" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="variety">Variety</Label>
            <Input id="variety" name="variety" placeholder="e.g. Koroneiki, Eureka" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plantingDate">Planting Date</Label>
            <Input id="plantingDate" name="plantingDate" type="date" />
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
              <Select name="plotId">
                <SelectTrigger id="plotId">
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
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="locationDescription">Location Description</Label>
            <Input
              id="locationDescription"
              name="locationDescription"
              placeholder="e.g. North field, row 3, position 5"
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
            <Select name="status" defaultValue="healthy">
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
            <Label htmlFor="estimatedAnnualYield">Estimated Annual Yield</Label>
            <div className="flex gap-2">
              <Input
                id="estimatedAnnualYield"
                name="estimatedAnnualYield"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                className="flex-1"
              />
              <Select name="yieldUnit" defaultValue="kg">
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
              placeholder="Any health observations…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">📝 Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Additional notes about this tree…"
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TreePine className="mr-2 h-4 w-4" />
          )}
          {isPending ? 'Saving…' : 'Register Tree'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

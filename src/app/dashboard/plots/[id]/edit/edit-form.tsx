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
import { updatePlot, deletePlot } from '@/app/actions/plots'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'resting', label: 'Resting' },
  { value: 'needs_prep', label: 'Needs Preparation' },
]

interface Plot {
  id: string
  name: string
  description: string | null
  areaSqm: string | null
  status: string | null
}

export function EditPlotForm({ plot }: { plot: Plot }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [form, setForm] = useState({
    name: plot.name,
    areaSqm: plot.areaSqm ? parseFloat(plot.areaSqm).toString() : '',
    status: plot.status ?? 'available',
    description: plot.description ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updatePlot(plot.id, {
        name: form.name,
        description: form.description || undefined,
        areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
        status: form.status as 'available' | 'in_use' | 'resting' | 'needs_prep',
      })
      toast.success('Plot updated!')
      router.push(`/dashboard/plots/${plot.id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Delete this plot? Planting logs and crop plans linked to it will become unassigned.'
      )
    )
      return
    setIsDeleting(true)
    try {
      await deletePlot(plot.id)
      toast.success('Plot deleted')
      router.push('/dashboard/plots')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/plots/${plot.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plot
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Edit Plot</h1>
        <p className="text-muted-foreground">{plot.name}</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Plot Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plot Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="areaSqm">Area (m²)</Label>
                <Input
                  id="areaSqm"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.areaSqm}
                  onChange={(e) => set('areaSqm', e.target.value)}
                />
              </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description / Notes</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-between gap-3">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Plot'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

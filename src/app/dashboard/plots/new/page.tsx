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
import { createPlot } from '@/app/actions/plots'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'resting', label: 'Resting' },
  { value: 'needs_prep', label: 'Needs Preparation' },
]

export default function NewPlotPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    areaSqm: '',
    status: 'available',
    description: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) {
      toast.error('Plot name is required')
      return
    }
    setIsSubmitting(true)
    try {
      await createPlot({
        name: form.name,
        description: form.description || undefined,
        areaSqm: form.areaSqm ? parseFloat(form.areaSqm) : null,
        status: form.status as 'available' | 'in_use' | 'resting' | 'needs_prep',
      })
      toast.success('Plot created!')
      router.push('/dashboard/plots')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create plot')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/plots">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plots
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">New Plot</h1>
        <p className="text-muted-foreground">Define a new field, zone, or growing area</p>
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
                placeholder="e.g. Plot A, North Field, Greenhouse 1, Zone 3..."
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
                  placeholder="e.g. 500"
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
                placeholder="Location, soil type, irrigation notes..."
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Plot'}
          </Button>
        </div>
      </form>
    </div>
  )
}

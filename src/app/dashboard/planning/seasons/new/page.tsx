'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { createSeason } from '@/app/actions/planning'

export default function NewSeasonPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Auto-generate name from dates e.g. "Spring 2026"
  function suggestName() {
    if (!form.startDate) return
    const month = new Date(form.startDate).getMonth() + 1
    const year = new Date(form.startDate).getFullYear()
    const season = month <= 3 ? 'Winter' : month <= 6 ? 'Spring' : month <= 9 ? 'Summer' : 'Autumn'
    if (!form.name) set('name', `${season} ${year}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Please fill in all required fields')
      return
    }
    if (form.endDate <= form.startDate) {
      toast.error('End date must be after start date')
      return
    }
    setIsSubmitting(true)
    try {
      await createSeason(form)
      toast.success('Season created!')
      router.push('/dashboard/planning/seasons')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create season')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/planning/seasons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seasons
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">New Season</h1>
        <p className="text-muted-foreground">Create a growing season to group your crop plans</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Season Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={form.startDate}
                  onChange={(e) => {
                    set('startDate', e.target.value)
                    suggestName()
                  }}
                  onBlur={suggestName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Season Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Spring 2026, Summer Crops..."
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Auto-suggested from start date — edit as needed
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="e.g. Focus on tomatoes and peppers..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Season'}
          </Button>
        </div>
      </form>
    </div>
  )
}

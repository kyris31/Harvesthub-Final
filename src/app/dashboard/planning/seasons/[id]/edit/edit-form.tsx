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
import { updateSeason, deleteSeason } from '@/app/actions/planning'

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  notes: string | null
}

export function EditSeasonForm({ season }: { season: Season }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [form, setForm] = useState({
    name: season.name,
    startDate: season.startDate,
    endDate: season.endDate,
    notes: season.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.endDate <= form.startDate) {
      toast.error('End date must be after start date')
      return
    }
    setIsSubmitting(true)
    try {
      await updateSeason(season.id, form)
      toast.success('Season updated!')
      router.push('/dashboard/planning/seasons')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (
      !confirm('Delete this season? The crop plans will not be deleted but will become unassigned.')
    )
      return
    setIsDeleting(true)
    try {
      await deleteSeason(season.id)
      toast.success('Season deleted')
      router.push('/dashboard/planning/seasons')
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
          <Link href="/dashboard/planning/seasons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Seasons
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Edit Season</h1>
        <p className="text-muted-foreground">{season.name}</p>
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
                  onChange={(e) => set('startDate', e.target.value)}
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
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-between gap-3">
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Season'}
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

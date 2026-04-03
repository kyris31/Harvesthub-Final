'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { feedUsageSchema, type FeedUsageFormData } from '@/lib/validations/poultry'
import { recordFeedUsage, getPoultryFeed } from '@/app/actions/poultry-feed'
import { getFlocks } from '@/app/actions/flocks'

type FeedItem = {
  id: string
  feedType: string
  brand: string | null
  currentQuantity: string
  quantityUnit: string
  costPerUnit: string | null
}
type FlockItem = { id: string; name: string; currentCount: number; status: string }

export default function RecordFeedUsagePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [flockItems, setFlockItems] = useState<FlockItem[]>([])
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeedUsageFormData>({
    resolver: zodResolver(feedUsageSchema),
    defaultValues: {
      usageDate: new Date().toISOString().split('T')[0],
      quantityUnit: 'kg',
    },
  })

  const watchedFeedId = watch('feedId')
  const watchedQty = watch('quantityUsed')
  const selectedFeed = feedItems.find((f) => f.id === watchedFeedId)
  const estimatedCost =
    watchedQty && selectedFeed?.costPerUnit
      ? (Number(watchedQty) * Number(selectedFeed.costPerUnit)).toFixed(2)
      : null

  useEffect(() => {
    async function load() {
      try {
        const [feeds, flocks] = await Promise.all([getPoultryFeed(), getFlocks()])
        setFeedItems(feeds as FeedItem[])
        setFlockItems(flocks.filter((f) => f.status === 'active') as FlockItem[])
      } catch {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function onSubmit(data: FeedUsageFormData) {
    setIsSubmitting(true)
    try {
      await recordFeedUsage(data)
      toast.success('Feed usage recorded! Inventory updated.')
      router.push('/dashboard/poultry/feed')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record usage')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center">Loading...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/poultry/feed">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed Management
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Record Feed Usage</h1>
        <p className="text-muted-foreground">Log how much feed was given to a flock today</p>
      </div>

      {feedItems.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">No feed in inventory yet.</p>
          <p className="mt-1 text-sm">
            You need to{' '}
            <Link href="/dashboard/poultry/feed/new" className="font-medium underline">
              add feed to inventory
            </Link>{' '}
            before recording usage.
          </p>
        </div>
      )}

      {flockItems.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="font-medium">No active flocks found.</p>
          <p className="mt-1 text-sm">
            Create an active flock first to record feed usage against it.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Usage Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="flockId">Flock *</Label>
                <Select onValueChange={(v) => setValue('flockId', v)}>
                  <SelectTrigger id="flockId">
                    <SelectValue placeholder="Select flock" />
                  </SelectTrigger>
                  <SelectContent>
                    {flockItems.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.currentCount} birds)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.flockId && (
                  <p className="text-destructive text-sm">{errors.flockId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageDate">Date *</Label>
                <Input type="date" id="usageDate" {...register('usageDate')} />
                {errors.usageDate && (
                  <p className="text-destructive text-sm">{errors.usageDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedId">Feed Bag / Batch *</Label>
              <Select onValueChange={(v) => setValue('feedId', v)}>
                <SelectTrigger id="feedId">
                  <SelectValue placeholder="Select feed from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {feedItems.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.feedType} — {f.brand || 'No brand'} ({f.currentQuantity} {f.quantityUnit}{' '}
                      left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.feedId && <p className="text-destructive text-sm">{errors.feedId.message}</p>}
              {selectedFeed && (
                <p className="text-muted-foreground text-xs">
                  Available: {selectedFeed.currentQuantity} {selectedFeed.quantityUnit}
                  {selectedFeed.costPerUnit && ` · €${selectedFeed.costPerUnit}/unit`}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantityUsed">Quantity Used *</Label>
                <Input
                  type="number"
                  step="0.1"
                  id="quantityUsed"
                  placeholder="e.g. 15"
                  {...register('quantityUsed')}
                />
                {errors.quantityUsed && (
                  <p className="text-destructive text-sm">{errors.quantityUsed.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityUnit">Unit</Label>
                <Select defaultValue="kg" onValueChange={(v) => setValue('quantityUnit', v)}>
                  <SelectTrigger id="quantityUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {estimatedCost && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium">
                  Feed cost for this entry: <strong>€{estimatedCost}</strong>
                  <span className="text-muted-foreground ml-2 font-normal">
                    (automatically counted in profit calculations)
                  </span>
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="e.g. Morning feeding, starter phase..."
                {...register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || feedItems.length === 0 || flockItems.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Record Usage'}
          </Button>
        </div>
      </form>
    </div>
  )
}

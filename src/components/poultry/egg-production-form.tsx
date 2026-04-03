'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { eggProductionSchema, type EggProductionFormData } from '@/lib/validations/poultry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createEggProduction } from '@/app/actions/egg-production'
import { getFlocks } from '@/app/actions/flocks'

interface EggProductionFormProps {
  initialData?: any
}

export function EggProductionForm({ initialData }: EggProductionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flocks, setFlocks] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EggProductionFormData>({
    resolver: zodResolver(eggProductionSchema),
    defaultValues: initialData || {
      collectionDate: new Date().toISOString().split('T')[0],
      eggsCracked: 0,
      eggsSmall: 0,
      eggsMedium: 0,
      eggsLarge: 0,
      eggsXLarge: 0,
    },
  })

  const watchedFlockId = watch('flockId')
  const watchedTotal = watch('eggsCollected')
  const watchedSmall = watch('eggsSmall')
  const watchedMedium = watch('eggsMedium')
  const watchedLarge = watch('eggsLarge')
  const watchedXLarge = watch('eggsXLarge')

  // Fetch active flocks
  useEffect(() => {
    async function loadFlocks() {
      try {
        const data = await getFlocks()
        const activeFlocks = data.filter((f) => f.status === 'active' && f.purpose !== 'broilers')
        setFlocks(activeFlocks)
      } catch (error) {
        console.error('Failed to load flocks:', error)
      }
    }
    loadFlocks()
  }, [])

  // Calculate total from sizes
  const sizeTotal =
    (watchedSmall || 0) + (watchedMedium || 0) + (watchedLarge || 0) + (watchedXLarge || 0)

  const onSubmit = async (data: EggProductionFormData) => {
    setIsSubmitting(true)
    try {
      await createEggProduction(data)
      toast.success('Egg production recorded successfully')
      router.push('/dashboard/poultry/eggs')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to record production')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flockId">Flock *</Label>
              <Select value={watchedFlockId} onValueChange={(value) => setValue('flockId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flock" />
                </SelectTrigger>
                <SelectContent>
                  {flocks.map((flock) => (
                    <SelectItem key={flock.id} value={flock.id}>
                      {flock.name} ({flock.currentCount} birds)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.flockId && (
                <p className="text-destructive text-sm">{errors.flockId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collectionDate">Collection Date *</Label>
              <Input id="collectionDate" type="date" {...register('collectionDate')} />
              {errors.collectionDate && (
                <p className="text-destructive text-sm">{errors.collectionDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Egg Count</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eggsCollected">Total Eggs Collected *</Label>
              <Input
                id="eggsCollected"
                type="number"
                {...register('eggsCollected')}
                placeholder="0"
              />
              {errors.eggsCollected && (
                <p className="text-destructive text-sm">{errors.eggsCollected.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eggsCracked">Cracked Eggs</Label>
              <Input id="eggsCracked" type="number" {...register('eggsCracked')} placeholder="0" />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="mb-3 font-medium">Size Breakdown (Optional)</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="eggsSmall">Small</Label>
                <Input id="eggsSmall" type="number" {...register('eggsSmall')} placeholder="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eggsMedium">Medium</Label>
                <Input id="eggsMedium" type="number" {...register('eggsMedium')} placeholder="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eggsLarge">Large</Label>
                <Input id="eggsLarge" type="number" {...register('eggsLarge')} placeholder="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eggsXLarge">X-Large</Label>
                <Input id="eggsXLarge" type="number" {...register('eggsXLarge')} placeholder="0" />
              </div>
            </div>
            {sizeTotal > 0 && (
              <p className="text-muted-foreground mt-2 text-sm">
                Size total: {sizeTotal} eggs
                {sizeTotal !== watchedTotal && (
                  <span className="text-warning ml-2">(doesn't match total collected)</span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any observations about today's collection..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Recording...' : 'Record Collection'}
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { broilerProcessingSchema, type BroilerProcessingFormData } from '@/lib/validations/poultry'
import { createProcessingRecord } from '@/app/actions/broiler-processing'

interface BroilerProcessingFormProps {
  flockId: string
  flockName: string
  currentCount: number
}

export function BroilerProcessingForm({
  flockId,
  flockName,
  currentCount,
}: BroilerProcessingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BroilerProcessingFormData>({
    resolver: zodResolver(broilerProcessingSchema),
    defaultValues: {
      flockId,
      processingDate: new Date().toISOString().split('T')[0],
      birdsProcessed: currentCount,
      processingCost: 0,
      transportCost: 0,
      otherCosts: 0,
    },
  })

  const watchedWeight = watch('totalWeightKg')
  const watchedPricePerKg = watch('pricePerKg')
  const watchedBirds = watch('birdsProcessed')

  // Auto-calculate total revenue preview
  const estimatedRevenue =
    watchedWeight && watchedPricePerKg ? Number(watchedWeight) * Number(watchedPricePerKg) : null

  // Auto-calculate avg weight preview
  const estimatedAvgWeight =
    watchedWeight && watchedBirds > 0
      ? (Number(watchedWeight) / Number(watchedBirds)).toFixed(3)
      : null

  async function onSubmit(data: BroilerProcessingFormData) {
    setIsSubmitting(true)
    try {
      await createProcessingRecord(data)
      toast.success('Processing record saved! Profit calculated.')
      router.push(`/dashboard/poultry/flocks/${flockId}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save processing record')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <input type="hidden" {...register('flockId')} />

      {/* Processing Details */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Details</CardTitle>
          <p className="text-muted-foreground text-sm">
            Recording sale/processing for: <strong>{flockName}</strong> ({currentCount} birds
            available)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="processingDate">Processing Date *</Label>
              <Input type="date" id="processingDate" {...register('processingDate')} />
              {errors.processingDate && (
                <p className="text-destructive text-sm">{errors.processingDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birdsProcessed">Birds Processed *</Label>
              <Input
                type="number"
                id="birdsProcessed"
                placeholder={`Max: ${currentCount}`}
                {...register('birdsProcessed')}
              />
              {errors.birdsProcessed && (
                <p className="text-destructive text-sm">{errors.birdsProcessed.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyerName">Buyer Name</Label>
            <Input
              id="buyerName"
              placeholder="e.g. Local market, processor name..."
              {...register('buyerName')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weight & Price */}
      <Card>
        <CardHeader>
          <CardTitle>Weight & Sale Price</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="totalWeightKg">Total Live Weight (kg) *</Label>
              <Input
                type="number"
                step="0.1"
                id="totalWeightKg"
                placeholder="e.g. 110.5"
                {...register('totalWeightKg')}
              />
              {estimatedAvgWeight && (
                <p className="text-muted-foreground text-xs">
                  Avg per bird: {estimatedAvgWeight} kg
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerKg">Price per kg (€ or $)</Label>
              <Input
                type="number"
                step="0.01"
                id="pricePerKg"
                placeholder="e.g. 1.80"
                {...register('pricePerKg')}
              />
            </div>
          </div>
          {estimatedRevenue !== null && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-800">
                Estimated Revenue: <strong>€{estimatedRevenue.toFixed(2)}</strong>
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="totalRevenue">Total Revenue (override, optional)</Label>
            <Input
              type="number"
              step="0.01"
              id="totalRevenue"
              placeholder="Leave blank to auto-calculate from weight × price"
              {...register('totalRevenue')}
            />
            <p className="text-muted-foreground text-xs">
              Only fill if you have a fixed total sale amount
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Costs */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Costs</CardTitle>
          <p className="text-muted-foreground text-sm">
            These are subtracted from revenue to calculate net profit
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="processingCost">Slaughterhouse / Processing Fee</Label>
              <Input
                type="number"
                step="0.01"
                id="processingCost"
                placeholder="0.00"
                {...register('processingCost')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportCost">Transport Cost</Label>
              <Input
                type="number"
                step="0.01"
                id="transportCost"
                placeholder="0.00"
                {...register('transportCost')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherCosts">Other Costs</Label>
              <Input
                type="number"
                step="0.01"
                id="otherCosts"
                placeholder="0.00"
                {...register('otherCosts')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Any additional notes..." {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Record Processing & Calculate Profit'}
        </Button>
      </div>
    </form>
  )
}

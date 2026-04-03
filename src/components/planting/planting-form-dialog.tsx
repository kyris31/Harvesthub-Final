'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  plantingLogSchema,
  PlantingLogFormValues,
  QUANTITY_UNITS,
} from '@/lib/schemas/planting-schema'
import { toast } from 'sonner'

interface PlantingFormDialogProps {
  mode: 'create' | 'edit'
  planting?: any
  onSuccess: () => void
}

export function PlantingFormDialog({ mode, planting, onSuccess }: PlantingFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [crops, setCrops] = useState<any[]>([])
  const [plots, setPlots] = useState<any[]>([])
  const [seedBatches, setSeedBatches] = useState<any[]>([])
  const [seedlings, setSeedlings] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  const form = useForm<PlantingLogFormValues>({
    resolver: zodResolver(plantingLogSchema),
    defaultValues: {
      cropId: planting?.cropId || '',
      plotId: planting?.plotId || '',
      plantingDate: planting?.plantingDate || new Date().toISOString().split('T')[0],
      quantityPlanted: planting?.quantityPlanted || '',
      quantityUnit: planting?.quantityUnit || 'seeds',
      expectedHarvestDate: planting?.expectedHarvestDate || '',
      seedBatchId: planting?.seedBatchId || '',
      purchasedSeedlingId: planting?.purchasedSeedlingId || '',
      notes: planting?.notes || '',
    },
  })

  const watchedCropId = form.watch('cropId')

  useEffect(() => {
    if (open) {
      fetchCropsAndPlots()
    }
  }, [open])

  const fetchCropsAndPlots = async () => {
    try {
      setIsLoadingData(true)
      const [cropsRes, plotsRes, batchesRes, seedlingsRes] = await Promise.all([
        fetch('/api/crops'),
        fetch('/api/plots'),
        fetch('/api/seed-batches'),
        fetch('/api/purchased-seedlings'),
      ])

      if (cropsRes.ok) {
        const cropsData = await cropsRes.json()
        setCrops(cropsData.crops || cropsData)
      }

      if (plotsRes.ok) {
        const plotsData = await plotsRes.json()
        setPlots(plotsData)
      }

      if (batchesRes.ok) {
        const batchesData = await batchesRes.json()
        setSeedBatches(batchesData)
      }

      if (seedlingsRes.ok) {
        const seedlingsData = await seedlingsRes.json()
        setSeedlings(seedlingsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const onSubmit = async (data: PlantingLogFormValues) => {
    setIsSubmitting(true)
    try {
      const url = mode === 'create' ? '/api/planting-logs' : `/api/planting-logs/${planting.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.message) {
          toast.error(errorData.message)
        } else {
          toast.error('Failed to save planting log')
        }
        return
      }

      toast.success(
        mode === 'create' ? 'Planting recorded successfully!' : 'Planting updated successfully!'
      )
      setOpen(false)
      form.reset()
      onSuccess()
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Planting
          </Button>
        ) : (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Record New Planting' : 'Edit Planting'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Record a new crop planting in your farm.'
              : 'Update planting information.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cropId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crop*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a crop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {crops.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id}>
                            {crop.name} {crop.variety && `- ${crop.variety}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plot/Field</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plot (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific plot</SelectItem>
                        {plots.map((plot) => (
                          <SelectItem key={plot.id} value={plot.id}>
                            {plot.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seed Batch Selection */}
              <FormField
                control={form.control}
                name="seedBatchId"
                render={({ field }) => {
                  const availableBatches = seedBatches.filter(
                    (b) => b.cropId === watchedCropId && parseFloat(b.currentQuantity) > 0
                  )
                  const selectedBatch = seedBatches.find((b) => b.id === field.value)

                  return (
                    <FormItem>
                      <FormLabel>Seed Batch (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        disabled={!watchedCropId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                watchedCropId ? 'Select seed batch or skip' : 'Select crop first'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No seed batch</SelectItem>
                          {availableBatches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.batchCode} - {batch.currentQuantity} {batch.quantityUnit}{' '}
                              available
                            </SelectItem>
                          ))}
                          {availableBatches.length === 0 && watchedCropId && (
                            <SelectItem value="no-stock" disabled>
                              No seed batches for this crop
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedBatch && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          📦 Available:{' '}
                          <span className="font-medium">
                            {selectedBatch.currentQuantity} {selectedBatch.quantityUnit}
                          </span>
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {/* Purchased Seedling Selection */}
              <FormField
                control={form.control}
                name="purchasedSeedlingId"
                render={({ field }) => {
                  const availableSeedlings = seedlings.filter(
                    (s) => s.cropId === watchedCropId && parseFloat(s.currentQuantity) > 0
                  )
                  const selectedSeedling = seedlings.find((s) => s.id === field.value)

                  return (
                    <FormItem>
                      <FormLabel>Purchased Seedlings (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                        disabled={!watchedCropId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                watchedCropId ? 'Select seedlings or skip' : 'Select crop first'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No purchased seedlings</SelectItem>
                          {availableSeedlings.map((seedling) => (
                            <SelectItem key={seedling.id} value={seedling.id}>
                              {seedling.currentQuantity} seedlings available
                            </SelectItem>
                          ))}
                          {availableSeedlings.length === 0 && watchedCropId && (
                            <SelectItem value="no-stock" disabled>
                              No seedlings for this crop
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {selectedSeedling && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          🌱 Available:{' '}
                          <span className="font-medium">
                            {selectedSeedling.currentQuantity} seedlings
                          </span>
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plantingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planting Date*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedHarvestDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Harvest</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantityPlanted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantityUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {QUANTITY_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Soil preparation, weather conditions, etc..."
                        {...field}
                        value={field.value || ''}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'create' ? 'Record Planting' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

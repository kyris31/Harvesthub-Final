'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
  FormDescription,
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
import { toast } from 'sonner'

interface SeedBatch {
  id: string
  batchCode: string
  cropId: string
  cropName: string
  cropVariety: string | null
  currentQuantity: string
  quantityUnit: string
  notes: string | null
}

interface Props {
  onSuccess: () => void
}

export function SeedlingProductionFormDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [seedBatches, setSeedBatches] = useState<SeedBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBatch, setSelectedBatch] = useState<SeedBatch | null>(null)

  const form = useForm({
    defaultValues: {
      seedBatchId: '',
      cropId: '',
      sowingDate: new Date().toISOString().split('T')[0],
      quantitySown: '',
      sowingUnit: '',
      expectedSeedlings: '',
      nurseryLocation: '',
      actualSeedlingsProduced: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) fetchBatches()
  }, [open])

  const fetchBatches = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/seed-batches')
      if (res.ok) {
        const data: SeedBatch[] = await res.json()
        data.sort((a, b) =>
          `${a.cropName} ${a.cropVariety ?? ''}`.localeCompare(
            `${b.cropName} ${b.cropVariety ?? ''}`
          )
        )
        setSeedBatches(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function onBatchSelect(batchId: string) {
    const batch = seedBatches.find((b) => b.id === batchId)
    if (!batch) return
    setSelectedBatch(batch)
    form.setValue('seedBatchId', batchId)
    form.setValue('cropId', batch.cropId)
    form.setValue('sowingUnit', batch.quantityUnit)
  }

  const onSubmit = async (data: any) => {
    if (!data.seedBatchId || !data.cropId) {
      toast.error('Please select a seed batch')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/seedling-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          expectedSeedlings: data.expectedSeedlings ? parseInt(data.expectedSeedlings) : null,
          actualSeedlingsProduced: data.actualSeedlingsProduced
            ? parseInt(data.actualSeedlingsProduced)
            : 0,
        }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create record')
      }
      toast.success('Sowing record added successfully!')
      setOpen(false)
      form.reset()
      setSelectedBatch(null)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Sowing Record
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Sowing Record</DialogTitle>
          <DialogDescription>
            Record seeds sown in nursery. Update actual seedlings produced once they germinate.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Seed Batch */}
              <FormField
                control={form.control}
                name="seedBatchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seed Batch *</FormLabel>
                    <Select onValueChange={onBatchSelect} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a seed batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seedBatches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id}>
                            {batch.cropName}
                            {batch.cropVariety && ` - ${batch.cropVariety}`}
                            {' (Batch: '}
                            {batch.batchCode}
                            {') - Avail: '}
                            {batch.currentQuantity} {batch.quantityUnit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Crop Info box */}
              {selectedBatch && (
                <div className="bg-muted/50 rounded-md border p-3 text-sm">
                  <p className="font-medium">Crop Information:</p>
                  <p>Name: {selectedBatch.cropName}</p>
                  {selectedBatch.cropVariety && <p>Variety: {selectedBatch.cropVariety}</p>}
                  <p>Notes: {selectedBatch.notes ?? 'N/A'}</p>
                </div>
              )}

              {/* Sowing Date */}
              <FormField
                control={form.control}
                name="sowingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sowing Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quantity + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantitySown"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quantity Sown
                        {selectedBatch ? ` (${selectedBatch.quantityUnit})` : ''} *
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedSeedlings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Est. Total Individual Seeds</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="1000" {...field} />
                      </FormControl>
                      <FormDescription>Enter est. seeds or update seed batch.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Nursery Location */}
              <FormField
                control={form.control}
                name="nurseryLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nursery Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Greenhouse A, Tray 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actual Seedlings Produced */}
              <FormField
                control={form.control}
                name="actualSeedlingsProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Seedlings Produced (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="Enter count once known"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave blank now — edit the record once they grow.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Germination notes, conditions..."
                        rows={3}
                        {...field}
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
                  Add Sowing Record
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { plantingLogSchema, type PlantingLogFormData } from '@/lib/validations/planting'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPlantingLog, updatePlantingLog } from '@/app/actions/planting'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PlantingFormProps {
  crops: Array<{ id: string; name: string; variety: string | null }>
  plots: Array<{ id: string; name: string; areaSqm: string | null }>
  seedBatches?: Array<{
    id: string
    batchCode: string
    currentQuantity: string
    quantityUnit: string
    crop: { name: string; variety: string | null }
  }>
  selfProducedSeedlings?: Array<{
    id: string
    crop: { name: string; variety: string | null }
    productionDate: string | null
    currentSeedlingsAvailable: number | null
  }>
  purchasedSeedlings?: Array<{
    id: string
    crop: { name: string; variety: string | null }
    purchaseDate: string | null
    currentQuantity: number | null
  }>
  defaultValues?: PlantingLogFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function PlantingForm({
  crops,
  plots,
  seedBatches,
  selfProducedSeedlings,
  purchasedSeedlings,
  defaultValues,
  mode,
}: PlantingFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<PlantingLogFormData>({
    resolver: zodResolver(plantingLogSchema),
    defaultValues: defaultValues || {
      cropId: '',
      plotId: '',
      plantingSource: 'direct_sow',
      seedBatchId: '',
      selfProducedSeedlingId: '',
      purchasedSeedlingId: '',
      plantingDate: new Date().toISOString().split('T')[0],
      quantityPlanted: '',
      quantityUnit: 'plants',
      expectedHarvestDate: '',
      status: 'active',
      notes: '',
    },
  })

  async function onSubmit(data: PlantingLogFormData) {
    // Client-side date validation against seedling production/purchase date
    if (data.plantingSource === 'self_produced' && data.selfProducedSeedlingId) {
      const seedling = selfProducedSeedlings?.find((s) => s.id === data.selfProducedSeedlingId)
      if (seedling?.productionDate && data.plantingDate < seedling.productionDate) {
        toast({
          title: 'Invalid planting date',
          description: `Planting date cannot be before the seedling sowing date (${new Date(seedling.productionDate).toLocaleDateString('en-GB')}).`,
          variant: 'destructive',
        })
        return
      }
    }
    if (data.plantingSource === 'purchased' && data.purchasedSeedlingId) {
      const seedling = purchasedSeedlings?.find((s) => s.id === data.purchasedSeedlingId)
      if (seedling?.purchaseDate && data.plantingDate < seedling.purchaseDate) {
        toast({
          title: 'Invalid planting date',
          description: `Planting date cannot be before the seedling purchase date (${new Date(seedling.purchaseDate).toLocaleDateString('en-GB')}).`,
          variant: 'destructive',
        })
        return
      }
    }

    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updatePlantingLog(defaultValues.id, data)
        toast({
          title: 'Planting updated',
          description: 'Planting has been updated successfully.',
        })
      } else {
        await createPlantingLog(data)
        toast({
          title: 'Planting created',
          description: 'Planting has been added successfully.',
        })
      }
      router.push('/dashboard/planting')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="cropId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a crop" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {crops.map((crop) => (
                    <SelectItem key={crop.id} value={crop.id}>
                      {crop.name} {crop.variety && `(${crop.variety})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The crop you are planting</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Planting Source Selection */}
        <FormField
          control={form.control}
          name="plantingSource"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Planting Source *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-y-0 space-x-3">
                    <RadioGroupItem value="direct_sow" id="direct_sow" />
                    <Label htmlFor="direct_sow" className="cursor-pointer font-normal">
                      Direct Sow (from Seed Batch)
                    </Label>
                  </div>
                  <div className="flex items-center space-y-0 space-x-3">
                    <RadioGroupItem value="self_produced" id="self_produced" />
                    <Label htmlFor="self_produced" className="cursor-pointer font-normal">
                      Transplant (Self-Produced)
                    </Label>
                  </div>
                  <div className="flex items-center space-y-0 space-x-3">
                    <RadioGroupItem value="purchased" id="purchased" />
                    <Label htmlFor="purchased" className="cursor-pointer font-normal">
                      Transplant (Purchased Batch)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dynamic Dropdown based on Planting Source */}
        {form.watch('plantingSource') === 'direct_sow' && seedBatches && (
          <FormField
            control={form.control}
            name="seedBatchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seed Batch *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a seed batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {seedBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.crop.name}
                        {batch.crop.variety ? ` - ${batch.crop.variety}` : ''} (Batch:{' '}
                        {batch.batchCode}) — Avail: {batch.currentQuantity} {batch.quantityUnit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the seed batch you're planting from</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch('plantingSource') === 'self_produced' && selfProducedSeedlings && (
          <FormField
            control={form.control}
            name="selfProducedSeedlingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Self-Produced Seedling Batch *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a seedling batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selfProducedSeedlings.map((seedling) => (
                      <SelectItem key={seedling.id} value={seedling.id}>
                        {seedling.crop.name}
                        {seedling.crop.variety ? ` - ${seedling.crop.variety}` : ''} — Sown:{' '}
                        {seedling.productionDate || 'No date'} (Avail:{' '}
                        {seedling.currentSeedlingsAvailable ?? 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the self-produced seedling batch</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch('plantingSource') === 'purchased' && purchasedSeedlings && (
          <FormField
            control={form.control}
            name="purchasedSeedlingId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchased Seedling Batch *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a purchased seedling batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {purchasedSeedlings.map((seedling) => (
                      <SelectItem key={seedling.id} value={seedling.id}>
                        {seedling.crop.name}
                        {seedling.crop.variety ? ` - ${seedling.crop.variety}` : ''} — Purchased:{' '}
                        {seedling.purchaseDate || 'No date'} (Avail: {seedling.currentQuantity ?? 0}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Select the purchased seedling batch</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="plotId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plot (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plot (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plots.map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      {plot.name} {plot.areaSqm && `(${plot.areaSqm} m²)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Where you're planting this crop (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plantingDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planting Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>When did you plant this crop?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantityPlanted"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 100" {...field} />
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
                <FormLabel>Unit *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="plants">Plants</SelectItem>
                    <SelectItem value="seeds">Seeds</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="expectedHarvestDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Harvest Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>When do you expect to harvest? (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="harvested">Harvested</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this planting..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Planting' : 'Create Planting'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

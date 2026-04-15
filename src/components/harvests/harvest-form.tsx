'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { harvestLogSchema, type HarvestLogFormData } from '@/lib/validations/harvest'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createHarvestLog, updateHarvestLog } from '@/app/actions/harvests'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface HarvestFormProps {
  plantings: Array<{
    id: string
    plantingDate: string
    crop: { name: string; variety: string | null }
    plot: { name: string } | null
  }>
  defaultValues?: HarvestLogFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function HarvestForm({ plantings, defaultValues, mode }: HarvestFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<HarvestLogFormData>({
    resolver: zodResolver(harvestLogSchema),
    defaultValues: defaultValues || {
      plantingLogId: '',
      harvestDate: new Date().toISOString().split('T')[0],
      quantityHarvested: '',
      quantityUnit: 'kg',
      currentStock: '',
      qualityGrade: '',
      notes: '',
    },
  })

  async function onSubmit(data: HarvestLogFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateHarvestLog(defaultValues.id, data)
        toast({
          title: 'Harvest updated',
          description: 'Harvest has been updated successfully.',
        })
      } else {
        await createHarvestLog(data)
        toast({
          title: 'Harvest recorded',
          description: 'Harvest has been recorded successfully.',
        })
      }
      router.push('/dashboard/harvests')
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
          name="plantingLogId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planting *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a planting to harvest" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plantings.map((planting) => (
                    <SelectItem key={planting.id} value={planting.id}>
                      {planting.crop.name} {planting.crop.variety && `(${planting.crop.variety})`} -
                      Planted {new Date(planting.plantingDate).toLocaleDateString('en-GB')}
                      {planting.plot && ` in ${planting.plot.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Which planting are you harvesting from?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="harvestDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Harvest Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>When did you harvest?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantityHarvested"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Harvested *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 50"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      // Auto-fill current stock if it's empty
                      if (!form.getValues('currentStock')) {
                        form.setValue('currentStock', e.target.value)
                      }
                    }}
                  />
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
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="lbs">Pounds</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currentStock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Stock *</FormLabel>
              <FormControl>
                <Input placeholder="Auto-fills from quantity harvested" {...field} />
              </FormControl>
              <FormDescription>
                Amount currently in stock (defaults to quantity harvested, adjust if sold/used)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qualityGrade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quality Grade</FormLabel>
              <FormControl>
                <Input placeholder="e.g. A, Premium, Grade 1" {...field} />
              </FormControl>
              <FormDescription>Optional quality rating for this harvest</FormDescription>
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
                  placeholder="Add any notes about this harvest..."
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
            {mode === 'edit' ? 'Update Harvest' : 'Record Harvest'}
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

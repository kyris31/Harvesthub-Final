'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { seedBatchSchema, type SeedBatchFormData } from '@/lib/validations/inventory'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createSeedBatch, updateSeedBatch } from '@/app/actions/seed-batches'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SeedBatchFormProps {
  crops: Array<{ id: string; name: string; variety: string | null }>
  suppliers: Array<{ id: string; name: string }>
  defaultValues?: SeedBatchFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function SeedBatchForm({ crops, suppliers, defaultValues, mode }: SeedBatchFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SeedBatchFormData>({
    resolver: zodResolver(seedBatchSchema),
    defaultValues: defaultValues || {
      cropId: '',
      supplierId: '',
      batchCode: '',
      purchaseDate: '',
      initialQuantity: '',
      currentQuantity: '',
      quantityUnit: 'seeds',
      costPerUnit: '',
      totalCost: '',
      organicCertified: '',
      sourceType: 'purchased',
      notes: '',
    },
  })

  async function onSubmit(data: SeedBatchFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateSeedBatch(defaultValues.id, data)
        toast({
          title: 'Seed batch updated',
          description: 'Seed batch has been updated successfully.',
        })
      } else {
        await createSeedBatch(data)
        toast({
          title: 'Seed batch added',
          description: 'Seed batch has been added to inventory.',
        })
      }
      router.push('/dashboard/inventory/seeds')
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cropId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
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
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'edit' && (
            <FormField
              control={form.control}
              name="batchCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Code</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>Auto-generated identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="self-produced">Self Produced</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
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
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className={mode === 'create' ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-4'}>
          <FormField
            control={form.control}
            name="initialQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 1000"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      // Auto-set current quantity to match initial for new batches
                      if (mode === 'create') {
                        form.setValue('currentQuantity', e.target.value)
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === 'edit' && (
            <FormField
              control={form.control}
              name="currentQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Quantity *</FormLabel>
                  <FormControl>
                    <Input placeholder="Current stock" {...field} />
                  </FormControl>
                  <FormDescription>Adjust based on usage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
                    <SelectItem value="seeds">Seeds</SelectItem>
                    <SelectItem value="grams">Grams</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="packets">Packets</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="costPerUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Per Unit</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Cost</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="organicCertified"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organic Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status (Optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="certified">Certified Organic</SelectItem>
                  <SelectItem value="organic">Organic (Not Certified)</SelectItem>
                  <SelectItem value="untreated">Untreated</SelectItem>
                  <SelectItem value="conventional">Conventional</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sourceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value || 'purchased'}
                  className="flex gap-6 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="purchased" id="edit-src-purchased" />
                    <FormLabel htmlFor="edit-src-purchased" className="cursor-pointer font-normal">
                      Purchased
                    </FormLabel>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="self_produced" id="edit-src-self" />
                    <FormLabel htmlFor="edit-src-self" className="cursor-pointer font-normal">
                      Self-Produced
                    </FormLabel>
                  </div>
                </RadioGroup>
              </FormControl>
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
                  placeholder="Additional notes about this seed batch..."
                  className="resize-none"
                  rows={3}
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
            {mode === 'edit' ? 'Update Batch' : 'Add Batch'}
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

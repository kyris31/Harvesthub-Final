'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inputInventorySchema, type InputInventoryFormData } from '@/lib/validations/inventory'
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
import { createInputItem, updateInputItem } from '@/app/actions/input-inventory'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InputInventoryFormProps {
  suppliers: Array<{ id: string; name: string }>
  defaultValues?: InputInventoryFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function InputInventoryForm({ suppliers, defaultValues, mode }: InputInventoryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InputInventoryFormData>({
    resolver: zodResolver(inputInventorySchema),
    defaultValues: defaultValues || {
      name: '',
      type: 'fertilizer',
      supplierId: '',
      purchaseDate: '',
      initialQuantity: '',
      currentQuantity: '',
      quantityUnit: 'kg',
      costPerUnit: '',
      totalCost: '',
      minimumStockLevel: '',
      notes: '',
    },
  })

  async function onSubmit(data: InputInventoryFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateInputItem(defaultValues.id, data)
        toast({
          title: 'Input updated',
          description: 'Input item has been updated successfully.',
        })
      } else {
        await createInputItem(data)
        toast({
          title: 'Input added',
          description: 'Input item has been added to inventory.',
        })
      }
      router.push('/dashboard/inventory/inputs')
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. NPK Fertilizer 20-20-20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="fertilizer">Fertilizer</SelectItem>
                    <SelectItem value="pesticide">Pesticide</SelectItem>
                    <SelectItem value="soil_amendment">Soil Amendment</SelectItem>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="initialQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Quantity</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. 50"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      // Auto-fill current if empty
                      if (!form.getValues('currentQuantity')) {
                        form.setValue('currentQuantity', e.target.value)
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
            name="currentQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Quantity *</FormLabel>
                <FormControl>
                  <Input placeholder="Auto-fills" {...field} />
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
                    <SelectItem value="L">Liters</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="bottles">Bottles</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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

          <FormField
            control={form.control}
            name="minimumStockLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min. Stock Level</FormLabel>
                <FormControl>
                  <Input placeholder="Alert when low" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Low stock warning threshold</FormDescription>
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
                  placeholder="Additional notes about this item..."
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
            {mode === 'edit' ? 'Update Item' : 'Add Item'}
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

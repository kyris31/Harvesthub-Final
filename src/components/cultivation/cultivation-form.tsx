'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  cultivationActivitySchema,
  type CultivationActivityFormData,
} from '@/lib/validations/cultivation'
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
import { createCultivationActivity, updateCultivationActivity } from '@/app/actions/cultivation'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CultivationFormProps {
  plantingLogs: Array<{
    id: string
    crop: { name: string; variety: string | null }
    plot: { name: string } | null
  }>
  inputInventory: Array<{
    id: string
    name: string
    currentQuantity: string | null
    quantityUnit: string | null
  }>
  defaultValues?: CultivationActivityFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function CultivationForm({
  plantingLogs,
  inputInventory,
  defaultValues,
  mode,
}: CultivationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CultivationActivityFormData>({
    resolver: zodResolver(cultivationActivitySchema),
    defaultValues: defaultValues || {
      plantingLogId: '',
      activityType: 'watering',
      activityDate: new Date().toISOString().split('T')[0],
      inputInventoryId: '',
      quantityUsed: '',
      quantityUnit: '',
      cost: '',
      notes: '',
    },
  })

  async function onSubmit(data: CultivationActivityFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateCultivationActivity(defaultValues.id, data)
        toast({
          title: 'Success',
          description: 'Activity updated successfully',
        })
      } else {
        await createCultivationActivity(data)
        toast({
          title: 'Success',
          description: 'Activity created successfully',
        })
      }
      router.push('/dashboard/cultivation')
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
          name="activityType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="watering">💧 Watering</SelectItem>
                  <SelectItem value="fertilizing">🌱 Fertilizing</SelectItem>
                  <SelectItem value="pest_control">🐛 Pest Control</SelectItem>
                  <SelectItem value="weeding">🌿 Weeding</SelectItem>
                  <SelectItem value="pruning">✂️ Pruning</SelectItem>
                  <SelectItem value="other">📝 Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Type of cultivation activity performed</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plantingLogId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Related Planting (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a planting (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plantingLogs.map((log) => (
                    <SelectItem key={log.id} value={log.id}>
                      {log.crop.name} {log.crop.variety && `(${log.crop.variety})`}
                      {log.plot && ` - ${log.plot.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Link this activity to a specific planting</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activityDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>When was this activity performed?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inputInventoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input Used (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an input (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {inputInventory.map((input) => (
                    <SelectItem key={input.id} value={input.id}>
                      {input.name} ({input.currentQuantity || 0} {input.quantityUnit || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Material or input used (fertilizer, pesticide, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantityUsed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Used</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 5" {...field} />
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
                <FormLabel>Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="g">Grams</SelectItem>
                    <SelectItem value="l">Liters</SelectItem>
                    <SelectItem value="ml">Milliliters</SelectItem>
                    <SelectItem value="bags">Bags</SelectItem>
                    <SelectItem value="bottles">Bottles</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost (Optional)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormDescription>Cost associated with this activity</FormDescription>
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
                  placeholder="Add any notes about this activity..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>Additional details (max 1000 characters)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Activity' : 'Create Activity'}
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

'use client'

import { useForm, useFieldArray, useWatch } from 'react-hook-form'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCultivationActivity, updateCultivationActivity } from '@/app/actions/cultivation'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'

interface PlantingLog {
  id: string
  crop: { name: string; variety: string | null }
  plot: { name: string } | null
}

interface InputInventoryItem {
  id: string
  name: string
  currentQuantity: string | null
  quantityUnit: string | null
  costPerUnit: string | null
}

interface CultivationFormProps {
  plantingLogs: PlantingLog[]
  inputInventory: InputInventoryItem[]
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
      plantingLogIds: [],
      activityType: 'watering',
      activityDate: new Date().toISOString().split('T')[0],
      inputs: [],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inputs',
  })

  const watchedInputs = useWatch({ control: form.control, name: 'inputs' })

  // Auto-calculate cost for each input row when qty or selected input changes
  useEffect(() => {
    watchedInputs?.forEach((item, index) => {
      if (!item.inputInventoryId) return
      const inv = inputInventory.find((i) => i.id === item.inputInventoryId)
      if (!inv?.costPerUnit) return
      const qty = parseFloat(item.quantityUsed || '0')
      if (qty > 0) {
        const calculated = (qty * parseFloat(inv.costPerUnit)).toFixed(2)
        form.setValue(`inputs.${index}.cost`, calculated)
      }
    })
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(watchedInputs?.map((i) => ({ id: i.inputInventoryId, qty: i.quantityUsed }))),
    inputInventory,
    form,
  ])

  const totalCost = watchedInputs?.reduce((sum, item) => sum + parseFloat(item.cost || '0'), 0) ?? 0

  async function onSubmit(data: CultivationActivityFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateCultivationActivity(defaultValues.id, data)
        toast({ title: 'Success', description: 'Activity updated successfully' })
      } else {
        await createCultivationActivity(data)
        toast({ title: 'Success', description: 'Activity created successfully' })
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
        {/* Activity Type */}
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

        {/* Activity Date */}
        <FormField
          control={form.control}
          name="activityDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Date *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Related Plantings — multi-select checkboxes */}
        <FormField
          control={form.control}
          name="plantingLogIds"
          render={() => (
            <FormItem>
              <FormLabel>Related Plantings (Optional)</FormLabel>
              <FormDescription>Select all plantings this activity applies to</FormDescription>
              {plantingLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active plantings found.</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                  {plantingLogs.map((log) => (
                    <FormField
                      key={log.id}
                      control={form.control}
                      name="plantingLogIds"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(log.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value ?? []
                                field.onChange(
                                  checked
                                    ? [...current, log.id]
                                    : current.filter((v) => v !== log.id)
                                )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            {log.crop.name}
                            {log.crop.variety && ` (${log.crop.variety})`}
                            {log.plot && ` — ${log.plot.name}`}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Inputs Used — dynamic rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>Inputs Used (Optional)</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ inputInventoryId: '', quantityUsed: '', quantityUnit: '', cost: '' })
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Input
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No inputs added. Click "Add Input" to record materials used.
            </p>
          )}

          {fields.map((field, index) => {
            const selectedInv = inputInventory.find(
              (i) => i.id === watchedInputs?.[index]?.inputInventoryId
            )
            return (
              <Card key={field.id} className="border-dashed">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-medium">Input #{index + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`inputs.${index}.inputInventoryId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an input" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inputInventory.map((inv) => (
                              <SelectItem key={inv.id} value={inv.id}>
                                {inv.name} ({inv.currentQuantity || 0} {inv.quantityUnit || ''})
                                {inv.costPerUnit &&
                                  ` · €${Number(inv.costPerUnit).toFixed(2)}/unit`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`inputs.${index}.quantityUsed`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`inputs.${index}.quantityUnit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="bags">Bags</SelectItem>
                              <SelectItem value="bottles">Bottles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`inputs.${index}.cost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost (€)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          {selectedInv?.costPerUnit && (
                            <p className="text-muted-foreground text-xs">
                              Auto: €{Number(selectedInv.costPerUnit).toFixed(2)}/unit
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {fields.length > 0 && (
            <div className="text-right text-sm font-semibold">
              Total Cost: €{totalCost.toFixed(2)}
            </div>
          )}
        </div>

        {/* Notes */}
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

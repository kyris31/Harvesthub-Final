'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { z } from 'zod'
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
import { createSaleWithItems, updateSaleWithItems } from '@/app/actions/sales'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'

const saleItemSchema = z.object({
  harvestLogId: z.string().min(1, 'Please select a product'),
  quantity: z.string().min(1, 'Quantity is required'),
  pricePerUnit: z
    .string()
    .refine(
      (v) => v === '' || (!isNaN(Number(v)) && Number(v) >= 0),
      'Enter a valid price (0 or more, leave empty for free)'
    ),
})

const enhancedSaleSchema = z.object({
  customerId: z.string().optional().or(z.literal('')),
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  items: z.array(saleItemSchema).min(1, 'Add at least one product'),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue']).default('pending'),
  paymentMethod: z
    .enum(['cash', 'bank_transfer', 'check', 'card', 'other'])
    .optional()
    .or(z.literal('')),
  amountPaid: z.string().default('0'),
  notes: z.string().optional().or(z.literal('')),
})

type EnhancedSaleFormData = z.infer<typeof enhancedSaleSchema>

interface SaleFormEnhancedProps {
  customers: Array<{ id: string; name: string }>
  availableHarvests: Array<{
    id: string
    productName: string
    currentStock: string
    unit: string
    harvestDate: string
    qualityGrade: string | null
  }>
  mode?: 'create' | 'edit'
  saleId?: string
  initialValues?: EnhancedSaleFormData
}

export function SaleFormEnhanced({
  customers,
  availableHarvests,
  mode = 'create',
  saleId,
  initialValues,
}: SaleFormEnhancedProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EnhancedSaleFormData>({
    resolver: formResolver<EnhancedSaleFormData>(enhancedSaleSchema),
    defaultValues: initialValues || {
      customerId: '',
      saleDate: new Date().toISOString().slice(0, 10),
      items: [{ harvestLogId: '', quantity: '', pricePerUnit: '' }],
      paymentStatus: 'pending',
      paymentMethod: '',
      amountPaid: '0',
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const calculateTotal = () => {
    const items = form.watch('items')
    return items.reduce((total, item) => {
      const quantity = parseFloat(item.quantity || '0')
      const price = parseFloat(item.pricePerUnit || '0')
      return total + quantity * price
    }, 0)
  }

  async function onSubmit(data: EnhancedSaleFormData) {
    // A product can't be sold before it was harvested (same day is allowed).
    let hasDateError = false
    data.items.forEach((item, index) => {
      const harvest = availableHarvests.find((h) => h.id === item.harvestLogId)
      if (harvest?.harvestDate && harvest.harvestDate > data.saleDate) {
        form.setError(`items.${index}.harvestLogId`, {
          type: 'manual',
          message: `Harvested ${new Date(harvest.harvestDate).toLocaleDateString('en-GB')}, after the sale date`,
        })
        hasDateError = true
      }
    })
    if (hasDateError) return

    setIsLoading(true)
    try {
      const payload = {
        customerId: data.customerId || undefined,
        saleDate: data.saleDate,
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod || undefined,
        amountPaid: data.amountPaid,
        notes: data.notes || undefined,
        items: data.items.map((item) => ({
          harvestLogId: item.harvestLogId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit || '0',
        })),
      }

      if (mode === 'edit' && saleId) {
        await updateSaleWithItems(saleId, payload)
        toast({ title: 'Sale updated successfully!' })
      } else {
        await createSaleWithItems(payload)
        toast({ title: 'Sale recorded successfully!' })
      }
      router.push('/dashboard/sales')
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

  const totalAmount = calculateTotal()
  const amountPaid = parseFloat(form.watch('amountPaid') || '0')
  const balance = totalAmount - amountPaid

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Walk-in (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Leave empty for walk-in customers</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="saleDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sale Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Products</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ harvestLogId: '', quantity: '', pricePerUnit: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {availableHarvests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  No products available. Harvest some crops first!
                </p>
              </CardContent>
            </Card>
          ) : (
            fields.map((field, index) => {
              const selectedHarvestId = form.watch(`items.${index}.harvestLogId`)
              const selectedHarvest = availableHarvests.find((h) => h.id === selectedHarvestId)

              // Hide harvests already chosen in other rows so the same product
              // can't be sold twice in one sale.
              const takenIds = new Set(
                form
                  .watch('items')
                  .map((item, i) => (i === index ? '' : item.harvestLogId))
                  .filter(Boolean)
              )
              const selectableHarvests = availableHarvests.filter((h) => !takenIds.has(h.id))

              // A product can't be sold before it was harvested (same day is fine).
              const saleDate = form.watch('saleDate')
              const harvestedAfterSale = Boolean(
                selectedHarvest?.harvestDate && saleDate && selectedHarvest.harvestDate > saleDate
              )

              return (
                <Card key={field.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.harvestLogId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Product *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {selectableHarvests.map((harvest) => (
                                      <SelectItem key={harvest.id} value={harvest.id}>
                                        {harvest.productName}
                                        {harvest.qualityGrade && ` (${harvest.qualityGrade})`}
                                        {' — '}
                                        {harvest.currentStock} {harvest.unit} available
                                        {harvest.harvestDate &&
                                          ` · harvested ${new Date(harvest.harvestDate).toLocaleDateString('en-GB')}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-8 shrink-0"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {harvestedAfterSale && selectedHarvest && (
                        <p className="text-destructive text-sm">
                          This product was harvested on{' '}
                          {new Date(selectedHarvest.harvestDate).toLocaleDateString('en-GB')}, after
                          the sale date — it can&apos;t be sold before it was harvested.
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0" {...field} />
                              </FormControl>
                              {selectedHarvest && (
                                <FormDescription className="text-xs">
                                  Available: {selectedHarvest.currentStock} {selectedHarvest.unit}
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`items.${index}.pricePerUnit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price/Unit</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Leave empty or 0 for a free product
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {selectedHarvest &&
                      form.watch(`items.${index}.quantity`) &&
                      form.watch(`items.${index}.pricePerUnit`) && (
                        <div className="text-muted-foreground mt-2 text-sm">
                          Subtotal: €
                          {(
                            parseFloat(form.watch(`items.${index}.quantity`) || '0') *
                            parseFloat(form.watch(`items.${index}.pricePerUnit`) || '0')
                          ).toFixed(2)}
                        </div>
                      )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Payment Section */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Amount</span>
              <span>€{totalAmount.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
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
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col justify-end">
                <div className="text-sm font-medium">Balance Due</div>
                <div
                  className={`text-2xl font-bold ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}
                >
                  €{balance.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
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
          <Button type="submit" disabled={isLoading || availableHarvests.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Sale' : 'Record Sale'}
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

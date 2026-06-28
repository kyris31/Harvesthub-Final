'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { supplierInvoiceSchema, type SupplierInvoiceFormData } from '@/lib/validations/invoices'
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
import { createSupplierInvoice, updateSupplierInvoice } from '@/app/actions/supplier-invoices'
import { computeInvoice } from '@/lib/invoice-cost'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ITEM_UNITS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'L', label: 'L' },
  { value: 'ml', label: 'ml' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'seeds', label: 'Seeds' },
  { value: 'seedlings', label: 'Seedlings' },
  { value: 'bunches', label: 'Bunches' },
  { value: 'trays', label: 'Trays' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'crates', label: 'Crates' },
  { value: 'bags', label: 'Bags' },
  { value: 'tonnes', label: 'Tonnes' },
]

interface SupplierInvoiceFormProps {
  suppliers: Array<{ id: string; name: string }>
  defaultValues?: SupplierInvoiceFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function SupplierInvoiceForm({ suppliers, defaultValues, mode }: SupplierInvoiceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<SupplierInvoiceFormData>({
    resolver: formResolver<SupplierInvoiceFormData>(supplierInvoiceSchema),
    defaultValues: defaultValues || {
      supplierId: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      taxRate: '',
      shippingCost: '',
      discountAmount: '',
      items: [
        {
          description: '',
          quantity: '',
          unit: '',
          itemQtyPerPackage: '',
          itemUnit: '',
          pricePerUnit: '',
          category: '',
          discountType: '',
          discountValue: '',
          taxRate: '',
          notes: '',
        },
      ],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  async function onSubmit(data: SupplierInvoiceFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateSupplierInvoice(defaultValues.id, data)
        toast({ title: 'Invoice updated' })
      } else {
        await createSupplierInvoice(data)
        toast({ title: 'Invoice created' })
      }
      router.push('/dashboard/invoices')
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

  const totals = computeInvoice(form.watch('items'), {
    defaultTaxRate: form.watch('taxRate'),
    shippingCost: form.watch('shippingCost'),
    invoiceDiscount: form.watch('discountAmount'),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Header */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Header</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="CAS0093805" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Fields */}
            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="19.00" {...field} />
                    </FormControl>
                    <FormDescription>Applied to items without their own rate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Delivery charges</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Discount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Overall discount amount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  description: '',
                  quantity: '',
                  unit: '',
                  itemQtyPerPackage: '',
                  itemUnit: '',
                  pricePerUnit: '',
                  category: '',
                  discountType: '',
                  discountValue: '',
                  taxRate: '',
                  notes: '',
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-dashed">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-medium">Item #{index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Input placeholder="Sonata 1.38 SC" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty (Packages) *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.unit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Package Unit *</FormLabel>
                            <FormControl>
                              <Input placeholder="bottle" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.itemQtyPerPackage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Qty / Package</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.0001" placeholder="20" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.itemUnit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ITEM_UNITS.map((unit) => (
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

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.pricePerUnit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price / Package *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="20.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.taxRate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>VAT Rate (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={form.watch('taxRate') || '19.00'}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>Blank = default</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.category`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="seeds">Seeds</SelectItem>
                                <SelectItem value="fertilizer">Fertilizer</SelectItem>
                                <SelectItem value="pesticide">Pesticide</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Line Item Discount */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.discountType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || undefined}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="No discount" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="amount">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.discountValue`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                disabled={!form.watch(`items.${index}.discountType`)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch(`items.${index}.quantity`) &&
                      form.watch(`items.${index}.pricePerUnit`) &&
                      totals.lines[index] && (
                        <div className="text-muted-foreground space-y-1 text-sm">
                          <div>Subtotal: €{totals.lines[index].lineSubtotal.toFixed(2)}</div>
                          {totals.lines[index].lineDiscount > 0 && (
                            <div>Discount: -€{totals.lines[index].lineDiscount.toFixed(2)}</div>
                          )}
                          <div className="text-foreground font-semibold">
                            Line Total: €{totals.lines[index].lineTotal.toFixed(2)}
                          </div>
                          {totals.lines[index].lineTax > 0 && (
                            <div>
                              VAT ({totals.lines[index].taxRate}%): €
                              {totals.lines[index].lineTax.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal (after line discounts):</span>
              <span className="font-medium">€{totals.subtotal.toFixed(2)}</span>
            </div>

            {totals.invoiceDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice Discount:</span>
                <span className="font-medium text-red-600">
                  -€{totals.invoiceDiscount.toFixed(2)}
                </span>
              </div>
            )}

            {totals.taxAmount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After Discount:</span>
                  <span className="font-medium">€{totals.afterDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT:</span>
                  <span className="font-medium">€{totals.taxAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            {totals.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping:</span>
                <span className="font-medium">€{totals.shipping.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
              <span>Total Amount</span>
              <span className="text-2xl">€{totals.total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
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
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Invoice' : 'Create Invoice'}
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

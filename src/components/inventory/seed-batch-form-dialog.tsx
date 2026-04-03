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
import { seedBatchSchema, SeedBatchFormValues, QUANTITY_UNITS } from '@/lib/schemas/planting-schema'
import { toast } from 'sonner'

interface SeedBatchFormDialogProps {
  onSuccess: () => void
}

export function SeedBatchFormDialog({ onSuccess }: SeedBatchFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [crops, setCrops] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoadingCrops, setIsLoadingCrops] = useState(true)

  const form = useForm<SeedBatchFormValues>({
    resolver: zodResolver(seedBatchSchema),
    defaultValues: {
      cropId: '',
      supplierId: null,
      batchCode: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      initialQuantity: '',
      quantityUnit: 'seeds',
      costPerUnit: '',
      organicStatus: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      fetchCrops()
      // Auto-generate batch code
      const today = new Date()
      const code = `SB-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(
        Math.random() * 10000
      )
        .toString()
        .padStart(4, '0')}`
      form.setValue('batchCode', code)
    }
  }, [open])

  const fetchCrops = async () => {
    try {
      setIsLoadingCrops(true)
      const [cropsRes, suppliersRes] = await Promise.all([
        fetch('/api/crops?limit=500&sortBy=name&sortOrder=asc'),
        fetch('/api/suppliers'),
      ])
      if (cropsRes.ok) {
        const data = await cropsRes.json()
        setCrops(data.crops || data)
      }
      if (suppliersRes.ok) {
        const data = await suppliersRes.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error fetching crops:', error)
    } finally {
      setIsLoadingCrops(false)
    }
  }

  const onSubmit = async (data: SeedBatchFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/seed-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create seed batch')
      }

      toast.success('Seed batch added successfully!')
      setOpen(false)
      form.reset()
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Seed Batch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Seed Batch</DialogTitle>
          <DialogDescription>
            Record a new seed purchase or batch to track inventory.
          </DialogDescription>
        </DialogHeader>

        {isLoadingCrops ? (
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Code*</FormLabel>
                      <FormControl>
                        <Input placeholder="SB-20250101-0001" {...field} className="font-mono" />
                      </FormControl>
                      <FormDescription>Auto-generated, can edit</FormDescription>
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
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No supplier</SelectItem>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="initialQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="1000" {...field} />
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
                name="costPerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Per Unit (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.50"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>For cost tracking</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organicStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organic Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Status (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Select Status (Optional)</SelectItem>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Supplier details, quality notes..."
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
                  Add Seed Batch
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

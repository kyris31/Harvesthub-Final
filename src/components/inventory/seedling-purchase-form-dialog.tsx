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
import { purchasedSeedlingSchema, PurchasedSeedlingFormValues } from '@/lib/schemas/planting-schema'
import { toast } from 'sonner'

interface SeedlingPurchaseFormDialogProps {
  onSuccess: () => void
}

export function SeedlingPurchaseFormDialog({ onSuccess }: SeedlingPurchaseFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [crops, setCrops] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoadingCrops, setIsLoadingCrops] = useState(true)

  const form = useForm<PurchasedSeedlingFormValues>({
    resolver: zodResolver(purchasedSeedlingSchema),
    defaultValues: {
      cropId: '',
      supplierId: null,
      purchaseDate: new Date().toISOString().split('T')[0],
      quantityPurchased: '',
      costPerSeedling: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      fetchCrops()
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

  const onSubmit = async (data: PurchasedSeedlingFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/purchased-seedlings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record seedling purchase')
      }

      toast.success('Seedling purchase recorded successfully!')
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
          Record Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Seedling Purchase</DialogTitle>
          <DialogDescription>Track seedlings you've purchased for planting.</DialogDescription>
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
                          <SelectValue placeholder="Select crop type" />
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
                  name="quantityPurchased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input type="number" step="1" placeholder="50" {...field} />
                      </FormControl>
                      <FormDescription>Number of seedlings</FormDescription>
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

              <FormField
                control={form.control}
                name="costPerSeedling"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Per Seedling (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.50"
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Supplier, variety details, etc..."
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
                  Record Purchase
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

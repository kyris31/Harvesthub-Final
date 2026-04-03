'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { flockSchema, type FlockFormData } from '@/lib/validations/poultry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createFlock, updateFlock } from '@/app/actions/flocks'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'

interface FlockFormProps {
  initialData?: any
  flockId?: string
}

export function FlockForm({ initialData, flockId }: FlockFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FlockFormData>({
    resolver: zodResolver(flockSchema),
    defaultValues: initialData || {
      status: 'active',
      purpose: 'layers',
      type: 'chicken',
    },
  })

  const watchedType = watch('type')
  const watchedPurpose = watch('purpose')
  const watchedStatus = watch('status')
  const watchedSupplierId = watch('supplierId')

  // Fetch suppliers on mount
  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await getSuppliersForSelect()
        setSuppliers(data)
      } catch (error) {
        console.error('Failed to load suppliers:', error)
      }
    }
    loadSuppliers()
  }, [])

  const onSubmit = async (data: FlockFormData) => {
    setIsSubmitting(true)
    try {
      if (flockId) {
        await updateFlock(flockId, data)
        toast.success('Flock updated successfully')
      } else {
        await createFlock(data)
        toast.success('Flock created successfully')
      }
      router.push('/dashboard/poultry/flocks')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save flock')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Flock Name *</Label>
              <Input id="name" {...register('name')} placeholder="e.g., Main Layer Flock" />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Poultry Type *</Label>
              <Select value={watchedType} onValueChange={(value) => setValue('type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chicken">Chicken</SelectItem>
                  <SelectItem value="duck">Duck</SelectItem>
                  <SelectItem value="turkey">Turkey</SelectItem>
                  <SelectItem value="goose">Goose</SelectItem>
                  <SelectItem value="quail">Quail</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-destructive text-sm">{errors.type.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" {...register('breed')} placeholder="e.g., Rhode Island Red" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Select
                value={watchedPurpose}
                onValueChange={(value) => setValue('purpose', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="layers">Layers (Eggs)</SelectItem>
                  <SelectItem value="broilers">Broilers (Meat)</SelectItem>
                  <SelectItem value="dual_purpose">Dual Purpose</SelectItem>
                </SelectContent>
              </Select>
              {errors.purpose && (
                <p className="text-destructive text-sm">{errors.purpose.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Count & Acquisition</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="initialCount">Initial Count *</Label>
              <Input
                id="initialCount"
                type="number"
                {...register('initialCount')}
                placeholder="100"
              />
              {errors.initialCount && (
                <p className="text-destructive text-sm">{errors.initialCount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentCount">Current Count *</Label>
              <Input
                id="currentCount"
                type="number"
                {...register('currentCount')}
                placeholder="95"
              />
              {errors.currentCount && (
                <p className="text-destructive text-sm">{errors.currentCount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateAcquired">Date Acquired *</Label>
              <Input id="dateAcquired" type="date" {...register('dateAcquired')} />
              {errors.dateAcquired && (
                <p className="text-destructive text-sm">{errors.dateAcquired.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                value={watchedSupplierId || '__none__'}
                onValueChange={(value) =>
                  setValue('supplierId', value === '__none__' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="costPerBird">Cost Per Bird</Label>
              <Input
                id="costPerBird"
                type="number"
                step="0.01"
                {...register('costPerBird')}
                placeholder="5.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost">Total Cost</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                {...register('totalCost')}
                placeholder="500.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watchedStatus}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="depleted">Depleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="housingLocation">Housing Location</Label>
            <Input
              id="housingLocation"
              {...register('housingLocation')}
              placeholder="e.g., Coop A, Barn 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this flock..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : flockId ? 'Update Flock' : 'Create Flock'}
        </Button>
      </div>
    </form>
  )
}

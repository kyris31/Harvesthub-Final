'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Edit, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Props {
  record: {
    id: string
    cropName: string
    cropVariety: string | null
    sowingDate: string
    actualSeedlingsProduced: number
    currentSeedlingsAvailable: number
    nurseryLocation: string | null
    readyForTransplantDate: string | null
    notes: string | null
  }
  onSuccess: () => void
}

export function SeedlingProductionEditDialog({ record, onSuccess }: Props) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      actualSeedlingsProduced: record.actualSeedlingsProduced.toString(),
      currentSeedlingsAvailable: record.currentSeedlingsAvailable.toString(),
      nurseryLocation: record.nurseryLocation ?? '',
      readyForTransplantDate: record.readyForTransplantDate ?? '',
      notes: record.notes ?? '',
    },
  })

  const onSubmit = async (data: any) => {
    const actual = parseInt(data.actualSeedlingsProduced) || 0
    const available = parseInt(data.currentSeedlingsAvailable) || 0
    if (available > actual) {
      toast.error('Available cannot exceed actual produced')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/seedling-production/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualSeedlingsProduced: actual,
          currentSeedlingsAvailable: available,
          nurseryLocation: data.nurseryLocation,
          readyForTransplantDate: data.readyForTransplantDate,
          notes: data.notes,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Record updated!')
      setOpen(false)
      onSuccess()
    } catch {
      toast.error('Update failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            Update Production — {record.cropName}
            {record.cropVariety ? ` (${record.cropVariety})` : ''}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="actualSeedlingsProduced"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seedlings Produced *</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentSeedlingsAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available *</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nurseryLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nursery Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Greenhouse A..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="readyForTransplantDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ready for Transplant Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Textarea rows={3} {...field} />
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
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

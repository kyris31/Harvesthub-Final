'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cropSchema, type CropFormData } from '@/lib/validations/crops'
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
import { createCrop, updateCrop } from '@/app/actions/crops'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CropFormProps {
  defaultValues?: CropFormData & { id?: string }
  mode: 'create' | 'edit'
}

export function CropForm({ defaultValues, mode }: CropFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CropFormData>({
    resolver: zodResolver(cropSchema),
    defaultValues: defaultValues || {
      name: '',
      variety: '',
      category: undefined,
      description: '',
    },
  })

  async function onSubmit(data: CropFormData) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && defaultValues?.id) {
        await updateCrop(defaultValues.id, data)
        toast({
          title: 'Crop updated',
          description: `${data.name} has been updated successfully.`,
        })
      } else {
        await createCrop(data)
        toast({
          title: 'Crop created',
          description: `${data.name} has been added to your crops.`,
        })
      }
      router.push('/dashboard/crops')
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Crop Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Tomato" {...field} />
              </FormControl>
              <FormDescription>The common name of the crop</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="variety"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variety</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Cherry, Roma" {...field} />
              </FormControl>
              <FormDescription>The specific variety or cultivar (optional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vegetable">Vegetable</SelectItem>
                  <SelectItem value="fruit">Fruit</SelectItem>
                  <SelectItem value="herb">Herb</SelectItem>
                  <SelectItem value="grain">Grain</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The category this crop belongs to</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this crop..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes or characteristics</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update Crop' : 'Create Crop'}
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

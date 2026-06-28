'use client'

import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
]

export function InputCategoryFilter({ category }: { category?: string }) {
  const router = useRouter()

  const handleChange = (value: string) => {
    if (value === 'all') {
      router.push('/dashboard/inventory/inputs')
    } else {
      router.push(`/dashboard/inventory/inputs?category=${value}`)
    }
  }

  return (
    <Select value={category || 'all'} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by category" />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((c) => (
          <SelectItem key={c.value} value={c.value}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

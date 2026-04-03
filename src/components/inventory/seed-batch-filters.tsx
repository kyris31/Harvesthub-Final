'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowUpDown } from 'lucide-react'

export function SeedBatchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sortBy = searchParams.get('sortBy') ?? 'cropName'
  const sortOrder = searchParams.get('sortOrder') ?? 'asc'

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggleSortOrder() {
    update('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const isDefault = sortBy === 'cropName' && sortOrder === 'asc'

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('sortBy')
    params.delete('sortOrder')
    router.push(`${pathname}?${params.toString()}`)
  }

  const sortOrderLabel =
    sortBy === 'createdAt'
      ? sortOrder === 'asc'
        ? 'Oldest'
        : 'Newest'
      : sortOrder === 'asc'
        ? 'A → Z'
        : 'Z → A'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort By */}
      <Select value={sortBy} onValueChange={(v) => update('sortBy', v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cropName">Crop Name</SelectItem>
          <SelectItem value="batchCode">Batch Code</SelectItem>
          <SelectItem value="createdAt">Date Added</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Order Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleSortOrder}
        className="flex items-center gap-2"
      >
        <ArrowUpDown className="h-4 w-4" />
        {sortOrderLabel}
      </Button>

      {/* Clear Filters */}
      {!isDefault && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
          Clear filters
        </Button>
      )}
    </div>
  )
}

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { CROP_CATEGORIES } from '@/lib/schemas/crop-schema'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Filter } from 'lucide-react'

export function CropsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const category = searchParams.get('category') ?? 'all'
  const sortBy = searchParams.get('sortBy') ?? 'name'
  const sortOrder = searchParams.get('sortOrder') ?? 'asc'

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  function toggleSortOrder() {
    update('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const isDefault = category === 'all' && sortBy === 'name' && sortOrder === 'asc'

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('sortBy')
    params.delete('sortOrder')
    router.push(`${pathname}?${params.toString()}`)
  }

  const sortOrderLabel =
    sortBy === 'name'
      ? sortOrder === 'asc'
        ? 'A → Z'
        : 'Z → A'
      : sortOrder === 'asc'
        ? 'Oldest'
        : 'Newest'

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Category Filter */}
      <div className="flex items-center gap-2">
        <Filter className="text-muted-foreground h-4 w-4" />
        <Select value={category} onValueChange={(v) => update('category', v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CROP_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <Select value={sortBy} onValueChange={(v) => update('sortBy', v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">Name</SelectItem>
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

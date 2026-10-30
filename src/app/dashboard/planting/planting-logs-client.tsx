'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Edit, Search } from 'lucide-react'
import type { getPlantingLogs } from '@/app/actions/planting'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeletePlantingButton } from '@/components/planting/delete-planting-button'

type Planting = Awaited<ReturnType<typeof getPlantingLogs>>[number]

const STATUS_OPTIONS = ['active', 'harvested', 'failed', 'completed'] as const

const FILTER_KEY = 'planting-logs-filters'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function PlantingLogsClient({ plantings }: { plantings: Planting[] }) {
  const [search, setSearch] = useState('')
  // Empty array means "all statuses"
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [restored, setRestored] = useState(false)

  // Restore the filters after navigating away (e.g. adding a planting) and back
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(FILTER_KEY) ?? 'null')
      if (saved) {
        if (Array.isArray(saved.statusFilter)) setStatusFilter(saved.statusFilter)
        if (typeof saved.search === 'string') setSearch(saved.search)
      }
    } catch {}
    setRestored(true)
  }, [])

  useEffect(() => {
    if (!restored) return
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({ search, statusFilter }))
    } catch {}
  }, [restored, search, statusFilter])

  const toggleStatus = (s: string) =>
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const statusLabel =
    statusFilter.length === 0
      ? 'All Statuses'
      : statusFilter.length <= 2
        ? statusFilter.map(capitalize).join(', ')
        : `${statusFilter.length} statuses`

  const filtered = useMemo(() => {
    return plantings
      .filter((p) => {
        const label = `${p.crop.name}${p.crop.variety ? ` (${p.crop.variety})` : ''}`.toLowerCase()
        const matchesSearch = label.includes(search.toLowerCase().trim())
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(p.status ?? '')
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const nameA = `${a.crop.name} ${a.crop.variety ?? ''}`.trim()
        const nameB = `${b.crop.name} ${b.crop.variety ?? ''}`.trim()
        return nameA.localeCompare(nameB, 'el')
      })
  }, [plantings, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by crop name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between sm:w-[220px]">
              <span className="truncate">{statusLabel}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px]">
            <DropdownMenuCheckboxItem
              checked={statusFilter.length === 0}
              onCheckedChange={() => setStatusFilter([])}
              onSelect={(e) => e.preventDefault()}
            >
              All Statuses
            </DropdownMenuCheckboxItem>
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={statusFilter.includes(s)}
                onCheckedChange={() => toggleStatus(s)}
                onSelect={(e) => e.preventDefault()}
              >
                {capitalize(s)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Result count */}
      <p className="text-muted-foreground text-sm">
        {filtered.length} {filtered.length === 1 ? 'planting' : 'plantings'} found
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No plantings match your filters.</p>
          {(search || statusFilter.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearch('')
                setStatusFilter([])
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crop</TableHead>
              <TableHead>Plot</TableHead>
              <TableHead>Planting Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Expected Harvest</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((planting) => (
              <TableRow key={planting.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/planting/${planting.id}`} className="hover:underline">
                    {planting.crop.name}
                    {planting.crop.variety && ` (${planting.crop.variety})`}
                  </Link>
                </TableCell>
                <TableCell>{planting.plot?.name ?? '-'}</TableCell>
                <TableCell>{new Date(planting.plantingDate).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>
                  {planting.quantityPlanted} {planting.quantityUnit}
                </TableCell>
                <TableCell>
                  {planting.expectedHarvestDate
                    ? new Date(planting.expectedHarvestDate).toLocaleDateString('en-GB')
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      planting.status === 'active'
                        ? 'default'
                        : planting.status === 'harvested'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {planting.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/planting/${planting.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeletePlantingButton plantingId={planting.id} cropName={planting.crop.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

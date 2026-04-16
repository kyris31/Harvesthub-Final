'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit, Search } from 'lucide-react'
import type { getPlantingLogs } from '@/app/actions/planting'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const STATUS_OPTIONS = ['all', 'active', 'harvested', 'failed', 'completed'] as const

export function PlantingLogsClient({ plantings }: { plantings: Planting[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return plantings
      .filter((p) => {
        const label = `${p.crop.name}${p.crop.variety ? ` (${p.crop.variety})` : ''}`.toLowerCase()
        const matchesSearch = label.includes(search.toLowerCase().trim())
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        const nameA = `${a.crop.name} ${a.crop.variety ?? ''}`.trim()
        const nameB = `${b.crop.name} ${b.crop.variety ?? ''}`.trim()
        return nameA.localeCompare(nameB)
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <p className="text-muted-foreground text-sm">
        {filtered.length} {filtered.length === 1 ? 'planting' : 'plantings'} found
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No plantings match your filters.</p>
          {(search || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
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

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getHarvestLogs } from '@/app/actions/harvests'
import { DeleteHarvestButton } from '@/components/harvests/delete-harvest-button'

type Harvest = Awaited<ReturnType<typeof getHarvestLogs>>[number]

function displayName(harvest: Harvest): string {
  if (harvest.plantingLog) {
    const c = harvest.plantingLog.crop
    return `${c.name}${c.variety ? ` (${c.variety})` : ''}`
  }
  if (harvest.tree) {
    const t = harvest.tree
    return `🌳 ${t.species}${t.variety ? ` (${t.variety})` : ''} — ${t.identifier}`
  }
  return '—'
}

export function HarvestsTable({ harvests }: { harvests: Harvest[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return harvests
    return harvests.filter((h) => {
      const haystack = [
        displayName(h),
        h.qualityGrade ?? '',
        h.quantityUnit ?? '',
        new Date(h.harvestDate).toLocaleDateString('en-GB'),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [harvests, query])

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by crop, tree, quality…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No harvests match &quot;{query}&quot;.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crop</TableHead>
              <TableHead>Harvest Date</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((harvest) => (
              <TableRow key={harvest.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/harvests/${harvest.id}`} className="hover:underline">
                    {displayName(harvest)}
                  </Link>
                </TableCell>
                <TableCell>{new Date(harvest.harvestDate).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>
                  {harvest.quantityHarvested} {harvest.quantityUnit}
                </TableCell>
                <TableCell>
                  {harvest.currentStock} {harvest.quantityUnit}
                </TableCell>
                <TableCell>
                  {harvest.qualityGrade ? (
                    <Badge variant="outline">{harvest.qualityGrade}</Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/harvests/${harvest.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteHarvestButton
                      harvestId={harvest.id}
                      cropName={
                        harvest.plantingLog?.crop.name ?? harvest.tree?.species ?? 'Harvest'
                      }
                    />
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

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, TreePine, Leaf, AlertTriangle, Skull, Search, ArrowLeft, Trees } from 'lucide-react'
import { format } from 'date-fns'

type Tree = {
  id: string
  identifier: string
  species: string
  variety: string | null
  status: string | null
  plantingDate: string | null
  locationDescription: string | null
  estimatedAnnualYield: string | null
  yieldUnit: string | null
}

interface SpeciesGroup {
  key: string
  species: string
  variety: string | null
  trees: Tree[]
  counts: Record<string, number>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  healthy: {
    label: 'Healthy',
    color: 'text-green-600 bg-green-50',
    icon: <Leaf className="h-3.5 w-3.5" />,
  },
  sick: {
    label: 'Sick',
    color: 'text-amber-600 bg-amber-50',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  dead: {
    label: 'Dead',
    color: 'text-gray-500 bg-gray-100',
    icon: <Skull className="h-3.5 w-3.5" />,
  },
  removed: {
    label: 'Removed',
    color: 'text-red-500 bg-red-50',
    icon: <Skull className="h-3.5 w-3.5" />,
  },
}

export function TreesClient({ trees }: { trees: Tree[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Group by species + variety
  const speciesGroups = useMemo<SpeciesGroup[]>(() => {
    const map = new Map<string, SpeciesGroup>()
    for (const t of trees) {
      const key = `${t.species}||${t.variety ?? ''}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          species: t.species,
          variety: t.variety,
          trees: [],
          counts: {},
        })
      }
      const g = map.get(key)!
      g.trees.push(t)
      const s = t.status ?? 'healthy'
      g.counts[s] = (g.counts[s] ?? 0) + 1
    }
    return Array.from(map.values()).sort((a, b) => a.species.localeCompare(b.species))
  }, [trees])

  const selectedGroup = selectedKey ? speciesGroups.find((g) => g.key === selectedKey) : null

  // Filtered species groups (species view)
  const filteredGroups = useMemo(() => {
    return speciesGroups.filter((g) => {
      const matchSearch =
        !search ||
        g.species.toLowerCase().includes(search.toLowerCase()) ||
        (g.variety ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        statusFilter === 'all' || g.trees.some((t) => (t.status ?? 'healthy') === statusFilter)
      return matchSearch && matchStatus
    })
  }, [speciesGroups, search, statusFilter])

  // Filtered individual trees (species detail view)
  const filteredTrees = useMemo(() => {
    if (!selectedGroup) return []
    return selectedGroup.trees.filter((t) => {
      const matchSearch =
        !search ||
        t.identifier.toLowerCase().includes(search.toLowerCase()) ||
        (t.locationDescription ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || (t.status ?? 'healthy') === statusFilter
      return matchSearch && matchStatus
    })
  }, [selectedGroup, search, statusFilter])

  return (
    <div className="page-animate space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedGroup && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedKey(null)
                setSearch('')
              }}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              All Species
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedGroup
                ? `${selectedGroup.species}${selectedGroup.variety ? ` · ${selectedGroup.variety}` : ''}`
                : 'Trees'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {selectedGroup
                ? `${selectedGroup.trees.length} tree${selectedGroup.trees.length !== 1 ? 's' : ''} registered`
                : 'Track fruit and timber trees on your farm'}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/trees/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tree
          </Link>
        </Button>
      </div>

      {/* Search & Filters */}
      {trees.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
            <Input
              placeholder={
                selectedGroup ? 'Search by ID or location…' : 'Search species or variety…'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="healthy">✅ Healthy</SelectItem>
              <SelectItem value="sick">⚠️ Sick</SelectItem>
              <SelectItem value="dead">💀 Dead</SelectItem>
              <SelectItem value="removed">🗑️ Removed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Empty state */}
      {trees.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <TreePine className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-1 text-lg font-semibold">No trees registered yet</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Add your first tree to start tracking
            </p>
            <Button asChild>
              <Link href="/dashboard/trees/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tree
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Species groups view */}
      {!selectedGroup && trees.length > 0 && (
        <>
          {filteredGroups.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No species match your search.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredGroups.map((g) => (
                <button
                  key={g.key}
                  onClick={() => {
                    setSelectedKey(g.key)
                    setSearch('')
                  }}
                  className="text-left"
                >
                  <Card className="hover:border-primary/40 cursor-pointer border transition-all hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start gap-3">
                        <TreePine className="text-primary mt-0.5 h-6 w-6 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-bold">{g.species}</p>
                          {g.variety && (
                            <p className="text-muted-foreground text-sm">{g.variety}</p>
                          )}
                        </div>
                        <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-semibold">
                          {g.trees.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(g.counts).map(([s, count]) => {
                          const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.healthy
                          return (
                            <span
                              key={s}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}
                            >
                              {cfg.icon}
                              {count} {cfg.label}
                            </span>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Individual trees view (after clicking a species) */}
      {selectedGroup && (
        <>
          {filteredTrees.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No trees match your filter.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTrees.map((tree) => {
                const status = STATUS_CONFIG[tree.status ?? 'healthy'] ?? STATUS_CONFIG.healthy
                return (
                  <Link key={tree.id} href={`/dashboard/trees/${tree.id}`}>
                    <Card className="hover:border-primary/40 cursor-pointer border transition-all hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <TreePine className="text-primary h-5 w-5 shrink-0" />
                            <p className="font-bold">{tree.identifier}</p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                          >
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        {tree.locationDescription && (
                          <p className="text-muted-foreground mt-2 truncate text-xs">
                            📍 {tree.locationDescription}
                          </p>
                        )}
                        {tree.plantingDate && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            🌱 Planted {format(new Date(tree.plantingDate), 'dd MMM yyyy')}
                          </p>
                        )}
                        {tree.estimatedAnnualYield && (
                          <p className="text-muted-foreground mt-1 text-xs">
                            🍎 Est. yield: {tree.estimatedAnnualYield} {tree.yieldUnit ?? 'kg'}/year
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

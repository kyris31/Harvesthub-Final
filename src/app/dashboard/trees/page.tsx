import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getTrees } from '@/app/actions/trees'
import { Plus, TreePine, Leaf, AlertTriangle, Skull } from 'lucide-react'
import { format } from 'date-fns'

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

export default async function TreesPage() {
  const treeList = await getTrees()

  return (
    <div className="page-animate space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trees</h1>
          <p className="text-muted-foreground">Track fruit and timber trees on your farm</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/trees/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tree
          </Link>
        </Button>
      </div>

      {treeList.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {treeList.map((tree) => {
            const status = STATUS_CONFIG[tree.status ?? 'healthy'] ?? STATUS_CONFIG.healthy
            return (
              <Link key={tree.id} href={`/dashboard/trees/${tree.id}`}>
                <Card className="hover:border-primary/40 cursor-pointer border transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TreePine className="text-primary h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-bold">{tree.identifier}</p>
                          <p className="text-muted-foreground text-sm">
                            {tree.species}
                            {tree.variety ? ` · ${tree.variety}` : ''}
                          </p>
                        </div>
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
    </div>
  )
}

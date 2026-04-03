import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTree } from '@/app/actions/trees'
import { ArrowLeft, TreePine, Leaf, AlertTriangle, Skull, Pencil } from 'lucide-react'
import { format } from 'date-fns'
import { DeleteTreeButton } from './delete-button'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  healthy: {
    label: 'Healthy',
    color: 'text-green-700 bg-green-100',
    icon: <Leaf className="h-4 w-4" />,
  },
  sick: {
    label: 'Sick',
    color: 'text-amber-700 bg-amber-100',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  dead: { label: 'Dead', color: 'text-gray-600 bg-gray-100', icon: <Skull className="h-4 w-4" /> },
  removed: {
    label: 'Removed',
    color: 'text-red-600 bg-red-100',
    icon: <Skull className="h-4 w-4" />,
  },
}

export default async function TreeDetailPage({ params }: Props) {
  const { id } = await params
  let tree
  try {
    tree = await getTree(id)
  } catch {
    return notFound()
  }

  const status = STATUS_CONFIG[tree.status ?? 'healthy'] ?? STATUS_CONFIG['healthy']!

  function row(label: string, value: React.ReactNode) {
    if (!value) return null
    return (
      <div className="flex justify-between border-b py-2 last:border-0">
        <span className="text-muted-foreground text-sm">{label}</span>
        <span className="max-w-[60%] text-right text-sm font-medium">{value}</span>
      </div>
    )
  }

  return (
    <div className="page-animate max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/trees">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Trees
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <TreePine className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{tree.identifier}</h1>
            <p className="text-muted-foreground">
              {tree.species}
              {tree.variety ? ` · ${tree.variety}` : ''}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${status.color}`}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tree Details</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {row('Species', tree.species)}
          {row('Variety', tree.variety)}
          {row(
            'Planting Date',
            tree.plantingDate ? format(new Date(tree.plantingDate), 'dd MMMM yyyy') : null
          )}
          {row('Location', tree.locationDescription)}
          {row(
            'Est. Annual Yield',
            tree.estimatedAnnualYield
              ? `${tree.estimatedAnnualYield} ${tree.yieldUnit ?? 'kg'}`
              : null
          )}
          {row(
            'Last Harvest',
            tree.lastHarvestDate ? format(new Date(tree.lastHarvestDate), 'dd MMMM yyyy') : null
          )}
          {row('Health Notes', tree.healthNotes)}
          {row('Notes', tree.notes)}
          {row('Registered', format(new Date(tree.createdAt), 'dd MMMM yyyy'))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href={`/dashboard/trees/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Tree
          </Link>
        </Button>
        <DeleteTreeButton treeId={id} />
      </div>
    </div>
  )
}

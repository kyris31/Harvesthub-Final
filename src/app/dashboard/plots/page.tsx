import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, MapPin, Layers, BarChart3, CheckCircle2, Clock, Wrench, Leaf } from 'lucide-react'
import { getPlots } from '@/app/actions/plots'

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'text-green-700', bg: 'bg-green-50  border-green-200' },
  in_use: { label: 'In Use', color: 'text-blue-700', bg: 'bg-blue-50   border-blue-200' },
  resting: { label: 'Resting', color: 'text-amber-700', bg: 'bg-amber-50  border-amber-200' },
  needs_prep: {
    label: 'Needs Prep',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-200',
  },
}

export default async function PlotsPage() {
  const plots = await getPlots()

  const totalAreaSqm = plots.reduce((s, p) => s + (parseFloat(p.areaSqm ?? '0') || 0), 0)
  const available = plots.filter((p) => p.status === 'available').length
  const inUse = plots.filter((p) => p.status === 'in_use').length
  const resting = plots.filter((p) => p.status === 'resting').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plots & Fields</h1>
          <p className="text-muted-foreground">
            Manage your farm plots, zones, and field assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/plots/report">
              <BarChart3 className="mr-2 h-4 w-4" />
              Zone Report
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/plots/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Plot
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plots</CardTitle>
            <Layers className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plots.length}</div>
            <p className="text-muted-foreground text-xs">
              {totalAreaSqm > 0 ? `${totalAreaSqm.toLocaleString()} m² total` : 'No area set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{available}</div>
            <p className="text-muted-foreground text-xs">ready to plant</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <Leaf className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inUse}</div>
            <p className="text-muted-foreground text-xs">actively planted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resting / Prep</CardTitle>
            <Wrench className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{resting}</div>
            <p className="text-muted-foreground text-xs">resting or needs prep</p>
          </CardContent>
        </Card>
      </div>

      {/* Plots grid */}
      {plots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No plots yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first plot to organise planting by location
            </p>
            <Button asChild>
              <Link href="/dashboard/plots/new">
                <Plus className="mr-2 h-4 w-4" />
                Add First Plot
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plots.map((plot) => {
            const s =
              STATUS_CONFIG[plot.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available
            const activePlantings = plot.plantingLogs.filter((l) => l.status === 'active')
            const activePlans = plot.cropPlans.filter(
              (p) => p.status === 'planned' || p.status === 'in_progress'
            )
            const cropNames = [...new Set(activePlantings.map((l) => l.crop?.name).filter(Boolean))]

            return (
              <Link key={plot.id} href={`/dashboard/plots/${plot.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                        <CardTitle className="text-base leading-tight">{plot.name}</CardTitle>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {plot.areaSqm && (
                      <p className="text-muted-foreground ml-6 text-xs">
                        {parseFloat(plot.areaSqm).toLocaleString()} m²
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {plot.description && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {plot.description}
                      </p>
                    )}
                    <div className="text-muted-foreground flex gap-4 pt-1 text-xs">
                      <span className="flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        {activePlantings.length} active planting
                        {activePlantings.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activePlans.length} plan{activePlans.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {cropNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cropNames.slice(0, 3).map((n) => (
                          <span
                            key={n}
                            className="bg-muted inline-flex rounded-full px-2 py-0.5 text-xs"
                          >
                            {n}
                          </span>
                        ))}
                        {cropNames.length > 3 && (
                          <span className="bg-muted inline-flex rounded-full px-2 py-0.5 text-xs">
                            +{cropNames.length - 3} more
                          </span>
                        )}
                      </div>
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

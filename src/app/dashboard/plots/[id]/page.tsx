import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Edit, Leaf, Wheat, CalendarDays } from 'lucide-react'
import { getPlotById } from '@/app/actions/plots'

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

const PLAN_STATUS = {
  planned: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default async function PlotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plot = await getPlotById(id)
  if (!plot) return notFound()

  const s = STATUS_CONFIG[plot.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.available
  const activePlantings = plot.plantingLogs.filter((l) => l.status === 'active')
  const harvestedPlantings = plot.plantingLogs.filter(
    (l) => l.status === 'harvested' || l.status === 'completed'
  )
  const totalHarvested = plot.plantingLogs.reduce(
    (sum, l) => sum + l.harvestLogs.reduce((s, h) => s + parseFloat(h.quantityHarvested ?? '0'), 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/plots">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plots
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <MapPin className="text-muted-foreground mt-1 h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">{plot.name}</h1>
            <div className="mt-1 flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.color}`}
              >
                {s.label}
              </span>
              {plot.areaSqm && (
                <span className="text-muted-foreground text-sm">
                  {parseFloat(plot.areaSqm).toLocaleString()} m²
                </span>
              )}
            </div>
            {plot.description && <p className="text-muted-foreground mt-1">{plot.description}</p>}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/plots/${plot.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{activePlantings.length}</div>
            <p className="text-muted-foreground text-sm">Active plantings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{harvestedPlantings.length}</div>
            <p className="text-muted-foreground text-sm">Completed cycles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalHarvested.toFixed(1)} kg</div>
            <p className="text-muted-foreground text-sm">Total harvested</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Crop Plans */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> Crop Plans
            </CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/dashboard/planning/plans/new?plotId=${plot.id}`}>+ Add Plan</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {plot.cropPlans.length === 0 ? (
              <p className="text-muted-foreground text-sm">No crop plans for this plot yet.</p>
            ) : (
              <div className="space-y-2">
                {plot.cropPlans.map((plan) => {
                  const ps =
                    PLAN_STATUS[plan.status as keyof typeof PLAN_STATUS] ?? PLAN_STATUS.planned
                  return (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between rounded-lg border p-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium">{plan.crop?.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {plan.season?.name ?? 'No season'}
                          {plan.plannedPlantingDate ? ` · Plant: ${plan.plannedPlantingDate}` : ''}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ps}`}>
                        {plan.status?.replace('_', ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Plantings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" /> Active Plantings
            </CardTitle>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/planting/new">+ New Planting</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activePlantings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active plantings in this plot.</p>
            ) : (
              <div className="space-y-2">
                {activePlantings.map((planting) => (
                  <div
                    key={planting.id}
                    className="flex items-center justify-between rounded-lg border p-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{planting.crop?.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Planted: {planting.plantingDate}
                        {planting.expectedHarvestDate
                          ? ` · Harvest: ${planting.expectedHarvestDate}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {planting.quantityPlanted} {planting.quantityUnit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Harvest History */}
      {plot.plantingLogs.some((l) => l.harvestLogs.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5" /> Harvest History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium">Crop</th>
                    <th className="p-3 text-left font-medium">Date</th>
                    <th className="p-3 text-left font-medium">Quantity</th>
                    <th className="p-3 text-left font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {plot.plantingLogs
                    .flatMap((l) =>
                      l.harvestLogs.map((h) => ({
                        ...h,
                        cropName: l.crop?.name ?? '—',
                      }))
                    )
                    .sort((a, b) => b.harvestDate.localeCompare(a.harvestDate))
                    .map((h) => (
                      <tr key={h.id} className="hover:bg-muted/30 border-b">
                        <td className="p-3 font-medium">{h.cropName}</td>
                        <td className="text-muted-foreground p-3">{h.harvestDate}</td>
                        <td className="p-3">
                          {parseFloat(h.quantityHarvested).toLocaleString()} {h.quantityUnit}
                        </td>
                        <td className="p-3">{h.qualityGrade ?? '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

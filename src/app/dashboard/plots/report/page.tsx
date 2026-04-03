import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, MapPin, Leaf, Wheat, TrendingUp, BarChart3 } from 'lucide-react'
import { getPlotReport } from '@/app/actions/plots'

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

export default async function PlotReportPage() {
  const report = await getPlotReport()

  const grandTotalHarvested = report.reduce((s, p) => s + p.totalHarvestedKg, 0)
  const grandTotalRevenue = report.reduce((s, p) => s + p.totalRevenue, 0)
  const grandTotalAreaSqm = report.reduce((s, p) => s + (parseFloat(p.areaSqm ?? '0') || 0), 0)
  const totalActive = report.reduce((s, p) => s + p.activePlantingCount, 0)

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
      <div>
        <h1 className="text-3xl font-bold">Zone Report</h1>
        <p className="text-muted-foreground">Performance summary for each plot and field</p>
      </div>

      {/* Farm-wide summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plots</CardTitle>
            <MapPin className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.length}</div>
            <p className="text-muted-foreground text-xs">
              {grandTotalAreaSqm.toLocaleString()} m² total area
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plantings</CardTitle>
            <Leaf className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalActive}</div>
            <p className="text-muted-foreground text-xs">across all plots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvested</CardTitle>
            <Wheat className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {grandTotalHarvested.toFixed(1)} kg
            </div>
            <p className="text-muted-foreground text-xs">lifetime harvest</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              €{grandTotalRevenue.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">from plot harvests</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-plot breakdown */}
      {report.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BarChart3 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No plots yet</h3>
            <p className="text-muted-foreground mb-4">Create plots to see zone-based reporting</p>
            <Button asChild>
              <Link href="/dashboard/plots/new">Add First Plot</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Per-Plot Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium">Plot</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Area (m²)</th>
                    <th className="p-3 text-right font-medium">Active</th>
                    <th className="p-3 text-right font-medium">Completed</th>
                    <th className="p-3 text-right font-medium">Plans</th>
                    <th className="p-3 text-right font-medium">Harvested (kg)</th>
                    <th className="p-3 text-right font-medium">Revenue (€)</th>
                    <th className="p-3 text-left font-medium">Crops</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((plot) => {
                    const sc =
                      STATUS_CONFIG[plot.status as keyof typeof STATUS_CONFIG] ??
                      STATUS_CONFIG.available
                    return (
                      <tr key={plot.id} className="hover:bg-muted/30 border-b">
                        <td className="p-3">
                          <Link
                            href={`/dashboard/plots/${plot.id}`}
                            className="flex items-center gap-1.5 font-medium hover:underline"
                          >
                            <MapPin className="text-muted-foreground h-3.5 w-3.5" />
                            {plot.name}
                          </Link>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}
                          >
                            {sc.label}
                          </span>
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {plot.areaSqm ? parseFloat(plot.areaSqm).toLocaleString() : '—'}
                        </td>
                        <td className="p-3 text-right font-medium text-blue-600">
                          {plot.activePlantingCount}
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {plot.completedPlantingCount}
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {plot.activePlanCount}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {plot.totalHarvestedKg > 0 ? plot.totalHarvestedKg.toFixed(1) : '—'}
                        </td>
                        <td className="p-3 text-right font-medium text-emerald-600">
                          {plot.totalRevenue > 0 ? `€${plot.totalRevenue.toFixed(2)}` : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {plot.cropNames.slice(0, 2).map((n) => (
                              <span key={n} className="bg-muted rounded-full px-1.5 py-0.5 text-xs">
                                {n}
                              </span>
                            ))}
                            {plot.cropNames.length > 2 && (
                              <span className="bg-muted rounded-full px-1.5 py-0.5 text-xs">
                                +{plot.cropNames.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t font-medium">
                    <td className="p-3" colSpan={2}>
                      Totals
                    </td>
                    <td className="p-3 text-right">{grandTotalAreaSqm.toLocaleString()}</td>
                    <td className="p-3 text-right text-blue-600">{totalActive}</td>
                    <td className="p-3 text-right">
                      {report.reduce((s, p) => s + p.completedPlantingCount, 0)}
                    </td>
                    <td className="p-3 text-right">
                      {report.reduce((s, p) => s + p.activePlanCount, 0)}
                    </td>
                    <td className="p-3 text-right">{grandTotalHarvested.toFixed(1)}</td>
                    <td className="p-3 text-right text-emerald-600">
                      €{grandTotalRevenue.toFixed(2)}
                    </td>
                    <td className="p-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

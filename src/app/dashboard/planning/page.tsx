import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, CalendarDays, Sprout, CheckCircle2, Clock, Circle, XCircle } from 'lucide-react'
import { getSeasons, getCropPlans } from '@/app/actions/planning'

const STATUS_CONFIG = {
  planned: { label: 'Planned', icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-destructive', bg: 'bg-red-50' },
}

export default async function PlanningPage() {
  const [seasons, allPlans] = await Promise.all([getSeasons(), getCropPlans()])

  const planned = allPlans.filter((p) => p.status === 'planned').length
  const inProgress = allPlans.filter((p) => p.status === 'in_progress').length
  const completed = allPlans.filter((p) => p.status === 'completed').length

  const today = new Date().toISOString().split('T')[0]!
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
  const upcoming = allPlans.filter(
    (p) =>
      p.plannedPlantingDate && p.plannedPlantingDate >= today && p.plannedPlantingDate <= nextWeek
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seasonal Planning</h1>
          <p className="text-muted-foreground">
            Manage crop seasons, rotation plans, and planting schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/planning/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/planning/seasons/new">
              <Plus className="mr-2 h-4 w-4" />
              New Season
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/planning/plans/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Crop Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Sprout className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPlans.length}</div>
            <p className="text-muted-foreground text-xs">across {seasons.length} seasons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgress}</div>
            <p className="text-muted-foreground text-xs">{planned} planned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
            <p className="text-muted-foreground text-xs">this year</p>
          </CardContent>
        </Card>
        <Card className={upcoming.length > 0 ? 'border-amber-200 bg-amber-50/40' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planting This Week</CardTitle>
            <CalendarDays className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{upcoming.length}</div>
            <p className="text-muted-foreground text-xs">scheduled plantings</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming this week */}
      {upcoming.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <CalendarDays className="h-5 w-5" />
              Upcoming Plantings This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcoming.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-3"
                >
                  <div>
                    <p className="font-medium">{p.crop?.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {p.plot?.name ?? 'No plot'} · {p.season?.name ?? 'No season'}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {p.plannedPlantingDate === today ? 'Today' : p.plannedPlantingDate}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans by season */}
      {seasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No seasons yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first season to start planning crops
            </p>
            <Button asChild>
              <Link href="/dashboard/planning/seasons/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Season
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => {
            const plans = allPlans.filter((p) => p.seasonId === season.id)
            return (
              <Card key={season.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{season.name}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {season.startDate} → {season.endDate} · {plans.length} crop plan
                      {plans.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/planning/seasons/${season.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/planning/plans/new?seasonId=${season.id}`}>
                        <Plus className="mr-1 h-3 w-3" /> Add Plan
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                {plans.length > 0 && (
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="p-3 text-left font-medium">Crop</th>
                            <th className="p-3 text-left font-medium">Plot</th>
                            <th className="p-3 text-left font-medium">Planting</th>
                            <th className="p-3 text-left font-medium">Harvest</th>
                            <th className="p-3 text-left font-medium">Target</th>
                            <th className="p-3 text-left font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plans.map((plan) => {
                            const s =
                              STATUS_CONFIG[plan.status as keyof typeof STATUS_CONFIG] ??
                              STATUS_CONFIG.planned
                            const Icon = s.icon
                            return (
                              <tr key={plan.id} className="hover:bg-muted/30 border-b">
                                <td className="p-3 font-medium">{plan.crop?.name}</td>
                                <td className="text-muted-foreground p-3">
                                  {plan.plot?.name ?? '—'}
                                </td>
                                <td className="p-3">{plan.plannedPlantingDate ?? '—'}</td>
                                <td className="p-3">{plan.plannedHarvestDate ?? '—'}</td>
                                <td className="p-3">
                                  {plan.targetQuantity
                                    ? `${plan.targetQuantity} ${plan.targetUnit ?? ''}`
                                    : '—'}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${s.bg} ${s.color}`}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {s.label}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
                {plans.length === 0 && (
                  <CardContent>
                    <p className="text-muted-foreground py-2 text-sm">
                      No crop plans yet for this season.
                    </p>
                  </CardContent>
                )}
              </Card>
            )
          })}

          {/* Plans without a season */}
          {(() => {
            const unassigned = allPlans.filter((p) => !p.seasonId)
            if (unassigned.length === 0) return null
            return (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-muted-foreground">Unassigned Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {unassigned.map((plan) => {
                      const s =
                        STATUS_CONFIG[plan.status as keyof typeof STATUS_CONFIG] ??
                        STATUS_CONFIG.planned
                      const Icon = s.icon
                      return (
                        <div
                          key={plan.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div>
                            <p className="font-medium">{plan.crop?.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {plan.plot?.name ?? 'No plot'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${s.bg} ${s.color}`}
                          >
                            <Icon className="h-3 w-3" />
                            {s.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })()}
        </div>
      )}
    </div>
  )
}

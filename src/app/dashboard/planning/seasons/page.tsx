import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, CalendarRange } from 'lucide-react'
import { getSeasons } from '@/app/actions/planning'

export default async function SeasonsPage() {
  const seasons = await getSeasons()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seasons</h1>
          <p className="text-muted-foreground">Manage your growing seasons</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/planning/seasons/new">
            <Plus className="mr-2 h-4 w-4" />
            New Season
          </Link>
        </Button>
      </div>

      {seasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarRange className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No seasons yet</h3>
            <p className="text-muted-foreground mb-4">
              Create seasons to organise your crop plans (e.g. Spring 2026, Summer 2026)
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
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-left font-medium">Season Name</th>
                <th className="p-3 text-left font-medium">Start Date</th>
                <th className="p-3 text-left font-medium">End Date</th>
                <th className="p-3 text-left font-medium">Duration</th>
                <th className="p-3 text-left font-medium">Crop Plans</th>
                <th className="p-3 text-left font-medium">Notes</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => {
                const start = new Date(season.startDate)
                const end = new Date(season.endDate)
                const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                const planCount = season.cropPlans?.length ?? 0
                const now = new Date()
                const isActive = start <= now && end >= now
                const isPast = end < now

                return (
                  <tr key={season.id} className="hover:bg-muted/30 border-b">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{season.name}</span>
                        {isActive && (
                          <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            Active
                          </span>
                        )}
                        {isPast && (
                          <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            Past
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground p-3">{season.startDate}</td>
                    <td className="text-muted-foreground p-3">{season.endDate}</td>
                    <td className="text-muted-foreground p-3">{days} days</td>
                    <td className="p-3">
                      <span className="font-medium">{planCount}</span>
                      {planCount > 0 && (
                        <Link
                          href={`/dashboard/planning?season=${season.id}`}
                          className="text-primary ml-2 text-xs underline-offset-2 hover:underline"
                        >
                          view
                        </Link>
                      )}
                    </td>
                    <td className="text-muted-foreground max-w-[200px] truncate p-3">
                      {season.notes ?? '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/dashboard/planning/seasons/${season.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

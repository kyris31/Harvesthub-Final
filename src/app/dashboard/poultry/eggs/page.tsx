import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Egg, TrendingUp } from 'lucide-react'
import { getEggProduction, getEggProductionStats } from '@/app/actions/egg-production'
import { getFlocks } from '@/app/actions/flocks'

export default async function EggProductionPage() {
  const [records, stats, flocks] = await Promise.all([
    getEggProduction(),
    getEggProductionStats(),
    getFlocks(),
  ])

  const activeFlocks = flocks.filter((f) => f.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Egg Production</h1>
          <p className="text-muted-foreground">Track daily egg collection and quality</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/poultry/eggs/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Collection
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
            <Egg className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.totalEggs) || 0}</div>
            <p className="text-muted-foreground text-xs">
              {Number(stats.totalCracked) || 0} cracked total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.recordCount) || 0}</div>
            <p className="text-muted-foreground text-xs">Total collection records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Egg className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.totalEggs) || 0}</div>
            <p className="text-muted-foreground text-xs">{activeFlocks.length} active flocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Rate</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(stats.avgDaily).toFixed(0) || 0}/day</div>
            <p className="text-muted-foreground text-xs">Average daily eggs</p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Egg className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No egg production records yet</h3>
              <p className="text-muted-foreground mb-4">Start tracking your daily egg collection</p>
              <Button asChild>
                <Link href="/dashboard/poultry/eggs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Collection
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Flock</th>
                      <th className="p-3 text-right font-medium">Total</th>
                      <th className="p-3 text-right font-medium">Small</th>
                      <th className="p-3 text-right font-medium">Medium</th>
                      <th className="p-3 text-right font-medium">Large</th>
                      <th className="p-3 text-right font-medium">X-Large</th>
                      <th className="p-3 text-right font-medium">Cracked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/50 border-b">
                        <td className="p-3">
                          {new Date(record.collectionDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {flocks.find((f) => f.id === record.flockId)?.name || 'Unknown'}
                        </td>
                        <td className="p-3 text-right font-medium">{record.eggsCollected}</td>
                        <td className="text-muted-foreground p-3 text-right">
                          {record.eggsSmall || 0}
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {record.eggsMedium || 0}
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {record.eggsLarge || 0}
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {record.eggsXLarge || 0}
                        </td>
                        <td className="p-3 text-right">
                          {(record.eggsCracked ?? 0) > 0 && (
                            <span className="text-destructive">{record.eggsCracked}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

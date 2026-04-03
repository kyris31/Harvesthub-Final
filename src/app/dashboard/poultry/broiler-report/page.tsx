import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllBroilerFlocksSummary } from '@/app/actions/broiler-processing'
import {
  TrendingUp,
  TrendingDown,
  Bird,
  DollarSign,
  Scale,
  Wheat,
  Plus,
  AlertCircle,
} from 'lucide-react'

export default async function BroilerReportPage() {
  const flocks = await getAllBroilerFlocksSummary()

  const completedFlocks = flocks.filter((f) => f.isCompleted)
  const activeFlocks = flocks.filter((f) => !f.isCompleted)

  // Totals across all completed flocks
  const totalRevenue = completedFlocks.reduce((s, f) => s + f.totalRevenue, 0)
  const totalCosts = completedFlocks.reduce((s, f) => s + f.totalCosts, 0)
  const totalNetProfit = completedFlocks.reduce((s, f) => s + f.netProfit, 0)
  const totalBirdsProcessed = completedFlocks.reduce((s, f) => s + f.totalBirdsProcessed, 0)
  const avgProfitPerBird = totalBirdsProcessed > 0 ? totalNetProfit / totalBirdsProcessed : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Broiler Profit Report</h1>
          <p className="text-muted-foreground">
            Full lifecycle profit tracking — from chick purchase to sale
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/poultry/flocks/new">
            <Plus className="mr-2 h-4 w-4" />
            New Broiler Flock
          </Link>
        </Button>
      </div>

      {/* Overall Summary Cards */}
      {completedFlocks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
              <p className="text-muted-foreground text-xs">
                From {completedFlocks.length} completed flocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
              <TrendingDown className="text-destructive h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-destructive text-2xl font-bold">€{totalCosts.toFixed(2)}</div>
              <p className="text-muted-foreground text-xs">Chicks + feed + health + processing</p>
            </CardContent>
          </Card>

          <Card className={totalNetProfit >= 0 ? 'border-green-300' : 'border-destructive'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              {totalNetProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="text-destructive h-4 w-4" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${totalNetProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}
              >
                €{totalNetProfit.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">
                {totalRevenue > 0 ? ((totalNetProfit / totalRevenue) * 100).toFixed(1) : 0}% margin
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Profit / Bird</CardTitle>
              <Bird className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${avgProfitPerBird >= 0 ? 'text-green-600' : 'text-destructive'}`}
              >
                €{avgProfitPerBird.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">
                From {totalBirdsProcessed} birds total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active (In-Progress) Flocks */}
      {activeFlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              In-Progress Flocks ({activeFlocks.length})
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Cost accumulating — not yet sold/processed
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium">Flock</th>
                    <th className="p-3 text-right font-medium">Birds</th>
                    <th className="p-3 text-right font-medium">Days Old</th>
                    <th className="p-3 text-right font-medium">Chick Cost</th>
                    <th className="p-3 text-right font-medium">Feed Cost</th>
                    <th className="p-3 text-right font-medium">Total Cost So Far</th>
                    <th className="p-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeFlocks.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/50 border-b">
                      <td className="p-3 font-medium">{f.name}</td>
                      <td className="p-3 text-right">{f.currentCount}</td>
                      <td className="p-3 text-right">{f.daysToProcess}</td>
                      <td className="p-3 text-right">€{f.chickCost.toFixed(2)}</td>
                      <td className="p-3 text-right">€{f.totalFeedCost.toFixed(2)}</td>
                      <td className="text-destructive p-3 text-right font-semibold">
                        €{f.totalCosts.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/poultry/flocks/${f.id}`}>View</Link>
                          </Button>
                          <Button size="sm" asChild>
                            <Link href={`/dashboard/poultry/flocks/${f.id}/process`}>
                              Record Sale
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Flocks — Full Profit Table */}
      {completedFlocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Flocks — Profit Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium">Flock</th>
                    <th className="p-3 text-right font-medium">Birds</th>
                    <th className="p-3 text-right font-medium">Days</th>
                    <th className="p-3 text-right font-medium">Chick Cost</th>
                    <th className="p-3 text-right font-medium">Feed Cost</th>
                    <th className="p-3 text-right font-medium">Other</th>
                    <th className="p-3 text-right font-medium">Total Cost</th>
                    <th className="p-3 text-right font-medium">Revenue</th>
                    <th className="p-3 text-right font-bold font-medium">Net Profit</th>
                    <th className="p-3 text-right font-medium">Profit/Bird</th>
                    <th className="p-3 text-right font-medium">FCR</th>
                  </tr>
                </thead>
                <tbody>
                  {completedFlocks.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/50 border-b">
                      <td className="p-3">
                        <Link
                          href={`/dashboard/poultry/flocks/${f.id}`}
                          className="font-medium hover:underline"
                        >
                          {f.name}
                        </Link>
                        <p className="text-muted-foreground text-xs">{f.dateAcquired}</p>
                      </td>
                      <td className="p-3 text-right">{f.totalBirdsProcessed}</td>
                      <td className="p-3 text-right">{f.daysToProcess}</td>
                      <td className="p-3 text-right">€{f.chickCost.toFixed(2)}</td>
                      <td className="p-3 text-right">€{f.totalFeedCost.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        €{(f.totalHealthCost + f.processingExtraCosts).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-semibold">€{f.totalCosts.toFixed(2)}</td>
                      <td className="p-3 text-right font-semibold text-green-600">
                        €{f.totalRevenue.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span className={f.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}>
                          €{f.netProfit.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={f.profitPerBird >= 0 ? 'text-green-600' : 'text-destructive'}
                        >
                          €{f.profitPerBird.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-right">{f.fcr > 0 ? f.fcr.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-muted text-muted-foreground mt-4 rounded-lg p-3 text-xs">
              <strong>FCR</strong> = Feed Conversion Ratio (kg of feed per kg of live weight). Lower
              is better. Industry average: 1.6–1.8.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {flocks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bird className="text-muted-foreground mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">No broiler flocks yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create a flock with purpose set to "Broilers" to start tracking costs and profit from
              day one.
            </p>
            <Button asChild>
              <Link href="/dashboard/poultry/flocks/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Broiler Flock
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

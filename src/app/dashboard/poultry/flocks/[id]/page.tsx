import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Bird,
  Scale,
  Wheat,
  Plus,
  Calendar,
} from 'lucide-react'
import { getFlockProfitReport } from '@/app/actions/broiler-processing'
import { getFlocks } from '@/app/actions/flocks'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FlockDetailPage({ params }: Props) {
  const { id } = await params

  const allFlocks = await getFlocks()
  const flock = allFlocks.find((f) => f.id === id)

  if (!flock) return notFound()

  let profitReport = null
  try {
    profitReport = await getFlockProfitReport(id)
  } catch {
    // If no data or error, show empty state
  }

  const isBroiler = flock.purpose === 'broilers'
  const report = profitReport

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/poultry/flocks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Flocks
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{flock.name}</h1>
          <p className="text-muted-foreground">
            {flock.type} • {flock.purpose} • {flock.status}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Acquired: {flock.dateAcquired} — {flock.currentCount} birds remaining
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/poultry/feed`}>
              <Wheat className="mr-2 h-4 w-4" />
              Log Feed
            </Link>
          </Button>
          {isBroiler && flock.status !== 'sold' && (
            <Button asChild>
              <Link href={`/dashboard/poultry/flocks/${id}/process`}>
                <Scale className="mr-2 h-4 w-4" />
                Record Processing / Sale
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Broiler Profit Summary */}
      {isBroiler && report && (
        <>
          <div>
            <h2 className="mb-4 text-xl font-semibold">Profit Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-destructive text-2xl font-bold">
                    €{report.costs.totalCosts.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                    <div>Chicks: €{report.costs.chickCost.toFixed(2)}</div>
                    <div>Feed: €{report.costs.totalFeedCost.toFixed(2)}</div>
                    {report.costs.totalHealthCost > 0 && (
                      <div>Health: €{report.costs.totalHealthCost.toFixed(2)}</div>
                    )}
                    {report.costs.processingExtraCosts > 0 && (
                      <div>Processing: €{report.costs.processingExtraCosts.toFixed(2)}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    €{report.revenue.totalRevenue.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                    <div>{report.revenue.totalBirdsProcessed} birds sold</div>
                    {report.revenue.totalWeightKg > 0 && (
                      <div>{report.revenue.totalWeightKg.toFixed(1)} kg total</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={
                  report.profit.netProfit >= 0
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-destructive bg-red-50/30'
                }
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  {report.profit.netProfit >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="text-destructive h-4 w-4" />
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${report.profit.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}
                  >
                    €{report.profit.netProfit.toFixed(2)}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {report.profit.profitMargin.toFixed(1)}% margin
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Profit / Bird</CardTitle>
                  <Bird className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl font-bold ${report.profit.profitPerBird >= 0 ? 'text-green-600' : 'text-destructive'}`}
                  >
                    €{report.profit.profitPerBird.toFixed(2)}
                  </div>
                  <div className="text-muted-foreground mt-1 space-y-0.5 text-xs">
                    <div>{report.metrics.daysToProcess} days</div>
                    {report.metrics.fcr > 0 && <div>FCR: {report.metrics.fcr.toFixed(2)}</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Processing Records */}
          {report.processingRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.processingRecords.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-semibold">{r.processingDate}</p>
                        <p className="text-muted-foreground text-sm">
                          {r.birdsProcessed} birds · {r.totalWeightKg || '—'} kg · €
                          {parseFloat(r.pricePerKg || '0').toFixed(2)}/kg
                        </p>
                        {r.buyerName && (
                          <p className="text-muted-foreground text-sm">Buyer: {r.buyerName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          €{parseFloat(r.totalRevenue || '0').toFixed(2)}
                        </p>
                        <p className="text-muted-foreground text-xs">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feed Usage Summary */}
          {report.feedUsage.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Feed Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-sm">Total Feed Used</p>
                    <p className="text-xl font-bold">{report.metrics.totalFeedKg.toFixed(1)} kg</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-muted-foreground text-sm">Total Feed Cost</p>
                    <p className="text-xl font-bold">€{report.costs.totalFeedCost.toFixed(2)}</p>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-left font-medium">Feed Type</th>
                        <th className="p-3 text-right font-medium">Quantity (kg)</th>
                        <th className="p-3 text-right font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.feedUsage.map((r, i) => {
                        const cost =
                          parseFloat(r.quantityUsed || '0') * parseFloat(r.costPerUnit || '0')
                        return (
                          <tr key={i} className="hover:bg-muted/50 border-b">
                            <td className="p-3">{r.usageDate}</td>
                            <td className="p-3">{r.feedType || '—'}</td>
                            <td className="p-3 text-right">
                              {parseFloat(r.quantityUsed || '0').toFixed(1)}
                            </td>
                            <td className="p-3 text-right">€{cost.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* If no processing records yet, show estimated cost */}
          {report.processingRecords.length === 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Calendar className="h-8 w-8 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="font-semibold">
                      In Progress — {report.metrics.daysToProcess} days old
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Current cost so far: <strong>€{report.costs.totalCosts.toFixed(2)}</strong> (€
                      {flock.initialCount > 0
                        ? (report.costs.totalCosts / flock.initialCount).toFixed(2)
                        : '0'}
                      /bird). When ready to sell, click "Record Processing / Sale" above.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Basic Info for non-broilers */}
      {!isBroiler && (
        <Card>
          <CardHeader>
            <CardTitle>Flock Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-sm">Type</p>
                <p className="font-medium">{flock.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Breed</p>
                <p className="font-medium">{flock.breed || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Initial Count</p>
                <p className="font-medium">{flock.initialCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Current Count</p>
                <p className="font-medium">{flock.currentCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Cost per Bird</p>
                <p className="font-medium">€{parseFloat(flock.costPerBird || '0').toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Cost</p>
                <p className="font-medium">€{parseFloat(flock.totalCost || '0').toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

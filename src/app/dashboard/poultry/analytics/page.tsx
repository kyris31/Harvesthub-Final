import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Egg, AlertCircle } from 'lucide-react'
import { getFlocks } from '@/app/actions/flocks'
import { getEggProductionStats } from '@/app/actions/egg-production'
import { getPoultryFeed } from '@/app/actions/poultry-feed'

export default async function PoultryAnalyticsPage() {
  const [flocks, eggStats, feedInventory] = await Promise.all([
    getFlocks(),
    getEggProductionStats(),
    getPoultryFeed(),
  ])

  const activeFlocks = flocks.filter((f) => f.status === 'active')

  // Calculate financial metrics
  const totalBirds = activeFlocks.reduce((sum, f) => sum + f.currentCount, 0)
  const totalInvestment = activeFlocks.reduce((sum, f) => sum + parseFloat(f.totalCost || '0'), 0)

  const feedCosts = feedInventory.reduce((sum: number, item: any) => {
    return sum + parseFloat(item.totalCost || '0')
  }, 0)

  // Egg revenue calculation ($0.25 per egg)
  const eggPricePerUnit = 0.25
  const monthTotal = Number(eggStats.totalEggs) || 0
  const monthlyEggRevenue = monthTotal * eggPricePerUnit

  // Feed cost per month (estimate 10% monthly consumption)
  const monthlyFeedCost = feedCosts * 0.1

  // Net profit/loss
  const monthlyProfit = monthlyEggRevenue - monthlyFeedCost
  const profitMargin = monthlyEggRevenue > 0 ? (monthlyProfit / monthlyEggRevenue) * 100 : 0

  // Production efficiency
  const productionRate = totalBirds > 0 ? (monthTotal / totalBirds / 30) * 100 : 0
  const mortalityRate = 0 // Would come from mortality records

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Poultry Analytics</h1>
        <p className="text-muted-foreground">Financial metrics and production statistics</p>
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Financial Overview</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalInvestment.toFixed(2)}</div>
              <p className="text-muted-foreground text-xs">
                {totalBirds} birds across {activeFlocks.length} flocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="text-success h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-success text-2xl font-bold">€{monthlyEggRevenue.toFixed(2)}</div>
              <p className="text-muted-foreground text-xs">From {monthTotal} eggs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Feed Cost</CardTitle>
              <TrendingDown className="text-destructive h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-destructive text-2xl font-bold">
                €{monthlyFeedCost.toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">Estimated consumption</p>
            </CardContent>
          </Card>

          <Card className={monthlyProfit >= 0 ? 'border-success' : 'border-destructive'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
              {monthlyProfit >= 0 ? (
                <TrendingUp className="text-success h-4 w-4" />
              ) : (
                <TrendingDown className="text-destructive h-4 w-4" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-success' : 'text-destructive'}`}
              >
                €{Math.abs(monthlyProfit).toFixed(2)}
              </div>
              <p className="text-muted-foreground text-xs">{profitMargin.toFixed(1)}% margin</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Production Metrics</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Rate</CardTitle>
              <Egg className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{productionRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-xs">Eggs per bird per day</p>
              <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                <div
                  className="bg-success h-full transition-all"
                  style={{ width: `${Math.min(productionRate, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Per Egg</CardTitle>
              <DollarSign className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{monthTotal > 0 ? (monthlyFeedCost / monthTotal).toFixed(3) : '0.000'}
              </div>
              <p className="text-muted-foreground text-xs">Feed cost per egg</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mortality Rate</CardTitle>
              <AlertCircle className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mortalityRate.toFixed(1)}%</div>
              <p className="text-muted-foreground text-xs">Birds lost this month</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Flock Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Flock Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeFlocks.map((flock) => {
              const flockInvestment = parseFloat(flock.totalCost || '0')
              const costPerBird = flockInvestment / flock.currentCount
              const survivalRate = (flock.currentCount / flock.initialCount) * 100

              return (
                <div
                  key={flock.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{flock.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      {flock.type} • {flock.purpose} • {flock.currentCount} birds
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-8 text-right">
                    <div>
                      <p className="text-muted-foreground text-sm">Investment</p>
                      <p className="font-semibold">€{flockInvestment.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Cost/Bird</p>
                      <p className="font-semibold">€{costPerBird.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Survival</p>
                      <p
                        className={`font-semibold ${survivalRate >= 90 ? 'text-success' : survivalRate >= 75 ? 'text-warning' : 'text-destructive'}`}
                      >
                        {survivalRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ROI Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Return on Investment (ROI)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Break-Even Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Investment:</span>
                    <span className="font-medium">€{totalInvestment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Profit:</span>
                    <span
                      className={`font-medium ${monthlyProfit >= 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      €{monthlyProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Months to Break-Even:</span>
                    <span className="font-medium">
                      {monthlyProfit > 0 ? (totalInvestment / monthlyProfit).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Efficiency Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue per Bird:</span>
                    <span className="font-medium">
                      €{totalBirds > 0 ? (monthlyEggRevenue / totalBirds).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Feed Cost per Bird:</span>
                    <span className="font-medium">
                      €{totalBirds > 0 ? (monthlyFeedCost / totalBirds).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Profit per Bird:</span>
                    <span
                      className={`font-medium ${monthlyProfit >= 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      €{totalBirds > 0 ? (monthlyProfit / totalBirds).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

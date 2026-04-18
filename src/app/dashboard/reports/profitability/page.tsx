import { getProfitabilityReport } from '@/app/actions/reports'
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function fmt(n: number) {
  return n.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ProfitBadge({ profit }: { profit: number }) {
  if (profit > 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        <TrendingUp className="h-3 w-3" />
        +€{fmt(profit)}
      </span>
    )
  if (profit < 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
        <TrendingDown className="h-3 w-3" />
        -€{fmt(Math.abs(profit))}
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
      <Minus className="h-3 w-3" />
      €0.00
    </span>
  )
}

function margin(revenue: number, cost: number) {
  if (revenue === 0) return null
  return (((revenue - cost) / revenue) * 100).toFixed(1) + '%'
}

export default async function ProfitabilityReportPage() {
  const report = await getProfitabilityReport()
  const { totals, plantings, trees } = report

  return (
    <div className="page-animate space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/reports">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Reports
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profitability Report</h1>
        <p className="text-muted-foreground text-sm">
          Revenue vs. costs per planting and tree species
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">€{fmt(totals.revenue)}</p>
            <p className="text-muted-foreground text-xs">from sales linked to harvests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">€{fmt(totals.cost)}</p>
            <p className="text-muted-foreground text-xs">cultivation activities with cost</p>
          </CardContent>
        </Card>
        <Card
          className={
            totals.profit >= 0 ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'
          }
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-muted-foreground text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}
            >
              {totals.profit >= 0 ? '+' : '-'}€{fmt(Math.abs(totals.profit))}
            </p>
            <p className="text-muted-foreground text-xs">
              {margin(totals.revenue, totals.cost) ?? '—'} margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plantings table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🌱 Plantings — Ranked by Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {plantings.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">No plantings found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="px-4 py-2.5 text-left font-medium">#</th>
                    <th className="px-4 py-2.5 text-left font-medium">Crop</th>
                    <th className="px-4 py-2.5 text-left font-medium">Plot</th>
                    <th className="px-4 py-2.5 text-left font-medium">Planted</th>
                    <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                    <th className="px-4 py-2.5 text-right font-medium">Profit</th>
                    <th className="px-4 py-2.5 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {plantings.map((p, i) => (
                    <tr key={p.id} className="hover:bg-muted/30 border-b last:border-0">
                      <td className="text-muted-foreground px-4 py-2.5">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{p.label}</td>
                      <td className="text-muted-foreground px-4 py-2.5">{p.plotName ?? '—'}</td>
                      <td className="text-muted-foreground px-4 py-2.5">
                        {p.plantingDate
                          ? new Date(p.plantingDate).toLocaleDateString('en-GB')
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-green-700">€{fmt(p.revenue)}</td>
                      <td className="px-4 py-2.5 text-right text-red-600">€{fmt(p.cost)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <ProfitBadge profit={p.profit} />
                      </td>
                      <td className="text-muted-foreground px-4 py-2.5 text-right">
                        {margin(p.revenue, p.cost) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trees table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🌳 Tree Species — Ranked by Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trees.length === 0 ? (
            <p className="text-muted-foreground p-6 text-center text-sm">No trees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="px-4 py-2.5 text-left font-medium">#</th>
                    <th className="px-4 py-2.5 text-left font-medium">Species</th>
                    <th className="px-4 py-2.5 text-left font-medium">Trees</th>
                    <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                    <th className="px-4 py-2.5 text-right font-medium">Profit</th>
                    <th className="px-4 py-2.5 text-right font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {trees.map((t, i) => (
                    <tr key={t.label} className="hover:bg-muted/30 border-b last:border-0">
                      <td className="text-muted-foreground px-4 py-2.5">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium">{t.label}</td>
                      <td className="text-muted-foreground px-4 py-2.5">{t.treeCount}</td>
                      <td className="px-4 py-2.5 text-right text-green-700">€{fmt(t.revenue)}</td>
                      <td className="px-4 py-2.5 text-right text-red-600">€{fmt(t.cost)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <ProfitBadge profit={t.profit} />
                      </td>
                      <td className="text-muted-foreground px-4 py-2.5 text-right">
                        {margin(t.revenue, t.cost) ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Revenue = sale items linked to harvests from each planting/tree. Cost = cultivation
        activities (fertilizing, pest control, etc.) with a cost value assigned.
      </p>
    </div>
  )
}

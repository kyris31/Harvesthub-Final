import {
  getFinancialReport,
  getHarvestReport,
  getInventoryReport,
  getCultivationReport,
  getPlantingReport,
  getCropPerformanceReport,
  getCropLifecycleReport,
} from '@/app/actions/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sprout,
} from 'lucide-react'
import Link from 'next/link'

export default async function ReportsPage() {
  // Get last 30 days data
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [financial, harvest, inventory, cultivation, planting, cropPerf, seedlingLC] =
    await Promise.all([
      getFinancialReport(startDate, endDate),
      getHarvestReport(startDate, endDate),
      getInventoryReport(),
      getCultivationReport(startDate, endDate),
      getPlantingReport(startDate, endDate),
      getCropPerformanceReport(startDate, endDate),
      getCropLifecycleReport(startDate, endDate),
    ])

  const reports = [
    {
      title: 'Financial Report',
      description: 'Revenue, expenses, and profitability analysis',
      icon: DollarSign,
      href: '/dashboard/reports/financial',
      stats: [
        { label: 'Revenue', value: `€${financial.revenue.total.toFixed(2)}` },
        { label: 'Expenses', value: `€${financial.expenses.total.toFixed(2)}` },
        {
          label: 'Net Profit',
          value: `€${financial.profit.total.toFixed(2)}`,
          trend: financial.profit.total >= 0 ? 'up' : 'down',
        },
      ],
    },
    {
      title: 'Harvest Report',
      description: 'Yield analysis and productivity metrics',
      icon: TrendingUp,
      href: '/dashboard/reports/harvest',
      stats: [
        { label: 'Total Yield', value: `${harvest.totalYield.toFixed(2)} kg` },
        { label: 'Harvests', value: harvest.harvestCount.toString() },
      ],
    },
    {
      title: 'Inventory Report',
      description: 'Stock levels and inventory value tracking',
      icon: Package,
      href: '/dashboard/reports/inventory',
      stats: [
        { label: 'Total Value', value: `€${inventory.totalValue.toFixed(2)}` },
        {
          label: 'Low Stock Items',
          value: inventory.lowStockCount.toString(),
          trend: inventory.lowStockCount > 0 ? 'down' : 'neutral',
        },
      ],
    },
    {
      title: 'Cultivation Report',
      description: 'Activity tracking and input usage analysis',
      icon: Activity,
      href: '/dashboard/reports/cultivation',
      stats: [
        { label: 'Activities', value: cultivation.totalActivities.toString() },
        { label: 'Total Cost', value: `€${cultivation.totalCost.toFixed(2)}` },
      ],
    },
    {
      title: 'Planting Log Report',
      description: 'Overview of crop plantings, status, and expected harvest dates',
      icon: Sprout,
      href: '/dashboard/reports/planting',
      stats: [
        { label: 'Total Plantings', value: planting.total.toString() },
        { label: 'Active', value: planting.active.toString() },
        { label: 'Harvested', value: planting.harvested.toString() },
      ],
    },
    {
      title: 'Crop Performance Report',
      description: 'Planted, seedlings produced, harvested and sold per crop',
      icon: TrendingUp,
      href: '/dashboard/reports/crop-performance',
      stats: [
        { label: 'Crops Tracked', value: cropPerf.length.toString() },
        {
          label: 'Total Harvested',
          value: cropPerf.reduce((s, r) => s + r.totalProduced, 0).toFixed(2),
        },
      ],
    },
    {
      title: 'Crop Lifecycle Report',
      description:
        'Full lifecycle: direct sow, seedlings and purchased plants through to harvest and sales',
      icon: Sprout,
      href: '/dashboard/reports/crop-lifecycle',
      stats: [
        { label: 'Batches', value: seedlingLC.length.toString() },
        {
          label: 'Remaining',
          value: seedlingLC.reduce((s, r) => s + r.remaining, 0).toString(),
        },
      ],
    },
    {
      title: 'Broiler Profit Report',
      description: 'Lifecycle profit tracking per broiler flock — from chick cost to sale',
      icon: TrendingUp,
      href: '/dashboard/poultry/broiler-report',
      stats: [
        { label: 'Revenue', value: '€ per flock' },
        { label: 'Metrics', value: 'FCR · profit/bird' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View insights and analytics for your farm operations
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit (30d)</CardTitle>
            {financial.profit.total >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{financial.profit.total.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">
              {financial.profit.margin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Yield (30d)</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{harvest.totalYield.toFixed(2)} kg</div>
            <p className="text-muted-foreground text-xs">{harvest.harvestCount} harvests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{inventory.totalValue.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">
              {inventory.lowStockCount} low stock items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities (30d)</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cultivation.totalActivities}</div>
            <p className="text-muted-foreground text-xs">
              €{cultivation.totalCost.toFixed(2)} total cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.href} className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 rounded-lg p-2">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <div className="text-muted-foreground text-sm">{stat.label}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{stat.value}</div>
                        {stat.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-green-600" />}
                        {stat.trend === 'down' && (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="mt-4 w-full" variant="outline" asChild>
                  <Link href={report.href}>View Detailed Report</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

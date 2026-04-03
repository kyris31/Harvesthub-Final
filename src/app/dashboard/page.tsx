import { getDashboardMetrics, getRecentActivity } from '../actions/dashboard'
import { MetricCard } from '@/components/dashboard/metric-card'
import {
  Sprout,
  Apple,
  AlertTriangle,
  Euro,
  Clock,
  CalendarDays,
  ShoppingCart,
  Leaf,
  Egg,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'

const ACTIVITY_CONFIG = {
  planting: { icon: '🌱', label: 'Planting', color: 'bg-green-100 text-green-700' },
  harvest: { icon: '🌾', label: 'Harvest', color: 'bg-amber-100 text-amber-700' },
  sale: { icon: '💰', label: 'Sale', color: 'bg-blue-100 text-blue-700' },
}

const QUICK_ACTIONS = [
  {
    href: '/dashboard/planting/new',
    icon: Leaf,
    label: 'Add Planting',
    variant: 'default' as const,
  },
  {
    href: '/dashboard/harvest/new',
    icon: Apple,
    label: 'Record Harvest',
    variant: 'outline' as const,
  },
  { href: '/dashboard/sales/new', icon: Euro, label: 'New Sale', variant: 'outline' as const },
  {
    href: '/dashboard/expenses/new',
    icon: ShoppingCart,
    label: 'Add Expense',
    variant: 'outline' as const,
  },
  {
    href: '/dashboard/planning/plans/new',
    icon: CalendarDays,
    label: 'Plan Crop',
    variant: 'outline' as const,
  },
  {
    href: '/dashboard/poultry/eggs/new',
    icon: Egg,
    label: 'Log Eggs',
    variant: 'outline' as const,
  },
]

function getGreeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = name.split(' ')[0] ?? name
  return `${time}, ${firstName}`
}

export default async function DashboardPage() {
  const [metrics, recentActivity, session] = await Promise.all([
    getDashboardMetrics(),
    getRecentActivity(),
    auth.api.getSession({ headers: await headers() }),
  ])

  const userName = session?.user?.name ?? 'Farmer'

  return (
    <div className="page-animate space-y-6">
      {/* Greeting header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getGreeting(userName)} 👋</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Here's your farm overview for today
          </p>
        </div>
      </div>

      {/* Crop Metrics */}
      <div>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
          Crops & Fields
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Active Plantings"
            value={metrics.activePlantings}
            description="Currently growing"
            icon={Sprout}
          />
          <MetricCard
            title="Upcoming Harvests"
            value={metrics.upcomingHarvests}
            description="Next 7 days"
            icon={Apple}
          />
          <MetricCard
            title="Low Stock Items"
            value={metrics.lowStockItems}
            description="Need restocking"
            icon={AlertTriangle}
            className={metrics.lowStockItems > 0 ? 'border-orange-400 bg-orange-50/40' : ''}
          />
        </div>
      </div>

      {/* Business Metrics */}
      <div>
        <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
          Business
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Monthly Revenue"
            value={`€${metrics.monthlyRevenue.toFixed(2)}`}
            description="This month"
            icon={Euro}
          />
          <MetricCard
            title="Pending Sales"
            value={metrics.pendingSales}
            description="Awaiting payment"
            icon={Clock}
            className={metrics.pendingSales > 0 ? 'border-amber-400 bg-amber-50/40' : ''}
          />
          <MetricCard
            title="Active Seasons"
            value={metrics.activePlantings > 0 ? 'In Season' : 'Off Season'}
            description="Planning status"
            icon={CalendarDays}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, variant }) => (
              <Button
                key={href}
                asChild
                variant={variant}
                size="sm"
                className="h-auto flex-col gap-1.5 py-2.5 text-xs font-medium"
              >
                <Link href={href}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest farm operations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  No recent activity. Start by adding crops or planting logs.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity) => {
                  const cfg = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.planting
                  return (
                    <div
                      key={activity.id}
                      className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-lg p-2.5 transition-colors"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                        <p className="truncate text-sm">{activity.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-right">
                        {activity.amount && (
                          <span className="text-sm font-semibold text-green-700">
                            €{activity.amount.toFixed(2)}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          {formatDistanceToNow(activity.date, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  crops: 'Crops',
  planting: 'Planting',
  harvest: 'Harvest',
  cultivation: 'Cultivation',
  plots: 'Plots',
  report: 'Zone Report',
  planning: 'Planning',
  seasons: 'Seasons',
  calendar: 'Calendar',
  plans: 'Crop Plans',
  poultry: 'Poultry',
  flocks: 'Flocks',
  eggs: 'Egg Production',
  feed: 'Feed',
  usage: 'Feed Usage',
  analytics: 'Analytics',
  'broiler-report': 'Broiler Report',
  inventory: 'Inventory',
  'seed-batches': 'Seed Batches',
  seedlings: 'Seedlings',
  sales: 'Sales',
  expenses: 'Expenses',
  invoices: 'Invoices',
  suppliers: 'Suppliers',
  customers: 'Customers',
  trees: 'Trees',
  reports: 'Reports',
  reminders: 'Reminders',
  new: 'New',
  edit: 'Edit',
}

function label(seg: string): string {
  return SEGMENT_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
}

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Skip UUIDs from breadcrumb display
  const isUUID = (s: string) => /^[0-9a-f-]{36}$/.test(s)

  const crumbs: { href: string; label: string }[] = []
  let cumulative = ''
  for (const seg of segments) {
    cumulative += `/${seg}`
    if (isUUID(seg)) continue
    crumbs.push({ href: cumulative, label: label(seg) })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav className="text-muted-foreground flex min-w-0 items-center gap-1 text-sm">
      <Link
        href="/dashboard"
        className="hover:text-foreground flex shrink-0 items-center transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.slice(1).map((crumb, i) => (
        <span key={crumb.href} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          {i === crumbs.length - 2 ? (
            <span className="text-foreground truncate font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground truncate transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}

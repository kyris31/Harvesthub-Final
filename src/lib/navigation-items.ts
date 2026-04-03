import {
  LayoutDashboard,
  Sprout,
  Bird,
  TreePine,
  Wheat,
  Package,
  DollarSign,
  Users,
  Receipt,
  CalendarDays,
  Bell,
  MapPin,
  Warehouse,
  FileText,
  Droplets,
  Egg,
  ShoppingCart,
  BarChart3,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const navigationSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Farm overview and statistics',
      },
    ],
  },
  {
    title: 'Farm Operations',
    items: [
      {
        title: 'Crops',
        href: '/dashboard/crops',
        icon: Sprout,
        description: 'Manage crops and varieties',
      },
      {
        title: 'Flocks',
        href: '/dashboard/poultry/flocks',
        icon: Bird,
        description: 'Manage poultry flocks',
      },
      {
        title: 'Egg Production',
        href: '/dashboard/poultry/eggs',
        icon: Egg,
        description: 'Track daily egg collection',
      },
      {
        title: 'Feed Management',
        href: '/dashboard/poultry/feed',
        icon: ShoppingCart,
        description: 'Feed inventory and usage',
      },
      {
        title: 'Poultry Analytics',
        href: '/dashboard/poultry/analytics',
        icon: BarChart3,
        description: 'Financial metrics and stats',
      },

      {
        title: 'Trees',
        href: '/dashboard/trees',
        icon: TreePine,
        description: 'Track fruit and timber trees',
      },
    ],
  },
  {
    title: 'Records',
    items: [
      {
        title: 'Plots',
        href: '/dashboard/plots',
        icon: MapPin,
        description: 'Manage farm plots and fields',
      },
      {
        title: 'Zone Report',
        href: '/dashboard/plots/report',
        icon: BarChart3,
        description: 'Per-plot harvest & revenue',
      },
      {
        title: 'Planting',
        href: '/dashboard/planting',
        icon: Sprout,
        description: 'Planting logs and tracking',
      },
      {
        title: 'Cultivation',
        href: '/dashboard/cultivation',
        icon: Droplets,
        description: 'Track cultivation activities',
      },
      {
        title: 'Harvest',
        href: '/dashboard/harvest',
        icon: Wheat,
        description: 'Harvest records and inventory',
      },
      {
        title: 'Seed Batches',
        href: '/dashboard/inventory/seed-batches',
        icon: Warehouse,
        description: 'Seed inventory management',
      },
      {
        title: 'Seedlings',
        href: '/dashboard/inventory/seedlings',
        icon: Sprout,
        description: 'Purchased seedlings inventory',
      },
      {
        title: 'Inventory',
        href: '/dashboard/inventory',
        icon: Package,
        description: 'Seeds and inputs',
      },
    ],
  },
  {
    title: 'Business',
    items: [
      {
        title: 'Suppliers',
        href: '/dashboard/suppliers',
        icon: Users,
        description: 'Seed and input suppliers',
      },
      {
        title: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        description: 'Customer management',
      },
      {
        title: 'Harvest Orders',
        href: '/dashboard/harvest-orders',
        icon: ClipboardList,
        description: 'Customer pre-orders & picking list',
      },
      {
        title: 'Sales',
        href: '/dashboard/sales',
        icon: DollarSign,
        description: 'Revenue tracking',
      },
      {
        title: 'Expenses',
        href: '/dashboard/expenses',
        icon: Receipt,
        description: 'Cost tracking',
      },
      {
        title: 'Purchase Invoices',
        href: '/dashboard/invoices',
        icon: FileText,
        description: 'Supplier invoices & inventory',
      },
    ],
  },
  {
    title: 'Planning',
    items: [
      {
        title: 'Planning',
        href: '/dashboard/planning',
        icon: CalendarDays,
        description: 'Crop season overview',
      },
      {
        title: 'Seasons',
        href: '/dashboard/planning/seasons',
        icon: CalendarDays,
        description: 'Manage growing seasons',
      },
      {
        title: 'Calendar',
        href: '/dashboard/planning/calendar',
        icon: CalendarDays,
        description: 'Planting & harvest calendar',
      },
      {
        title: 'Reminders',
        href: '/dashboard/reminders',
        icon: Bell,
        description: 'Tasks and notifications',
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        title: 'Analytics',
        href: '/dashboard/reports',
        icon: FileText,
        description: 'Reports and insights',
      },
    ],
  },
]

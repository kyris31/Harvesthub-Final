'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigationSections } from '@/lib/navigation-items'
import { Leaf } from 'lucide-react'

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  // Debug: Log navigation items
  console.log('Navigation sections:', navigationSections.length)
  navigationSections.forEach((section) => {
    console.log(`Section: ${section.title}, Items: ${section.items.length}`)
  })

  return (
    <div className={cn('bg-card flex h-full flex-col border-r', className)}>
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Leaf className="h-6 w-6 text-green-600" />
          <span className="text-xl">HarvestHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && 'mt-6')}>
            <h3 className="text-muted-foreground mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer/User Section */}
      <div className="border-t p-4">
        <div className="bg-muted flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
            🌾
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium">My Farm</p>
            <p className="text-muted-foreground text-xs">Farm Management</p>
          </div>
        </div>
      </div>
    </div>
  )
}

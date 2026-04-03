'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import { navigationSections } from '@/lib/navigation-items'
import Image from 'next/image'

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/') || pathname.startsWith(href + '?')
  }

  return (
    <nav className="space-y-4 py-2">
      {navigationSections.map((section) => (
        <div key={section.title} className="space-y-0.5">
          <h3 className="text-muted-foreground/70 px-3 pt-2 pb-1 text-[10px] font-semibold tracking-widest uppercase">
            {section.title}
          </h3>
          {section.items.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {active && (
                  <span className="bg-primary absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full" />
                )}
                <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

export function Sidebar() {
  return (
    <div className="bg-sidebar hidden flex-col border-r md:flex md:w-60 lg:w-64">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-5">
        <Link href="/dashboard" className="group flex items-center">
          <Image
            src="/logo.png"
            alt="Bio & Fresh"
            width={72}
            height={29}
            className="object-contain transition-opacity group-hover:opacity-80"
            priority
          />
        </Link>
      </div>
      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2">
        <NavItems />
      </div>
    </div>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 md:hidden">
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="bg-sidebar w-60 p-0">
        <div className="flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center" onClick={() => setOpen(false)}>
              <Image
                src="/logo.png"
                alt="Bio & Fresh"
                width={72}
                height={29}
                className="object-contain"
                priority
              />
            </Link>
          </div>
          <ScrollArea className="flex-1 px-2">
            <NavItems onNavigate={() => setOpen(false)} />
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}

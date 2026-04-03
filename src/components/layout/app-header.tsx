'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserNav } from './user-nav'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './app-sidebar'

interface AppHeaderProps {
  user: {
    name: string
    email: string
  }
}

export function AppHeader({ user }: AppHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-background sticky top-0 z-40 flex h-16 items-center border-b px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        {/* Page Title Area - can be customized per page */}
        <div className="flex-1">{/* This will be replaced by page-specific titles */}</div>

        {/* User Navigation */}
        <UserNav user={user} />
      </div>
    </header>
  )
}

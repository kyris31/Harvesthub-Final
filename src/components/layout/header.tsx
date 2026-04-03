import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { MobileNav } from './sidebar'
import { UserMenu } from './user-menu'
import { Breadcrumb } from './breadcrumb'

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return null
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <header className="bg-background/80 sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-sm lg:h-[60px] lg:px-6">
      <MobileNav />
      <div className="min-w-0 flex-1">
        <Breadcrumb />
      </div>
      <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">{today}</span>
      <UserMenu user={session.user} />
    </header>
  )
}

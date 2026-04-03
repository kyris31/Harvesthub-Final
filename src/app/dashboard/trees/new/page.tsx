import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { NewTreeForm } from './tree-form'
import { db } from '@/lib/db'
import { plots, trees } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { eq, isNull } from 'drizzle-orm'

async function generateNextTreeId(userId: string): Promise<string> {
  const existingTrees = await db
    .select({ identifier: trees.identifier })
    .from(trees)
    .where(eq(trees.userId, userId))

  // Find highest T-XXX number already used
  let max = 0
  for (const { identifier } of existingTrees) {
    const match = identifier.match(/^T-(\d+)$/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > max) max = num
    }
  }

  return `T-${String(max + 1).padStart(3, '0')}`
}

export default async function NewTreePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id ?? ''

  const [plotList, nextId] = await Promise.all([
    userId
      ? db.select({ id: plots.id, name: plots.name }).from(plots).where(eq(plots.userId, userId))
      : Promise.resolve([]),
    userId ? generateNextTreeId(userId) : Promise.resolve('T-001'),
  ])

  return (
    <div className="page-animate space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/trees">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Register New Tree</h1>
        <p className="text-muted-foreground text-sm">
          Add a fruit or timber tree to your farm records
        </p>
      </div>
      <NewTreeForm plots={plotList} defaultIdentifier={nextId} />
    </div>
  )
}

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getTree } from '@/app/actions/trees'
import { EditTreeForm } from './edit-form'
import { db } from '@/lib/db'
import { plots } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTreePage({ params }: Props) {
  const { id } = await params
  let tree
  try {
    tree = await getTree(id)
  } catch {
    return notFound()
  }

  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id ?? ''
  const plotList = userId
    ? await db
        .select({ id: plots.id, name: plots.name })
        .from(plots)
        .where(eq(plots.userId, userId))
    : []

  return (
    <div className="page-animate space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/trees/${id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Tree — {tree.identifier}</h1>
        <p className="text-muted-foreground text-sm">Update the details for this tree</p>
      </div>
      <EditTreeForm tree={tree} />
    </div>
  )
}

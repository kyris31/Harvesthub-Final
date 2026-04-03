import { NewCropPlanForm } from './plan-form'
import { getSeasons } from '@/app/actions/planning'
import { getSuppliersForSelect } from '@/app/actions/form-helpers'
import { getFlocks } from '@/app/actions/flocks'
import { db } from '@/lib/db'
import { crops, plots } from '@/lib/db/schema'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { eq, isNull, and } from 'drizzle-orm'

export default async function NewCropPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ seasonId?: string }>
}) {
  const { seasonId } = await searchParams
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id ?? ''

  const [seasons, allCrops, allPlots] = await Promise.all([
    getSeasons(),
    db.query.crops.findMany({
      where: and(eq(crops.userId, userId), isNull(crops.deletedAt)),
      orderBy: crops.name,
    }),
    db.query.plots.findMany({
      where: and(eq(plots.userId, userId), isNull(plots.deletedAt)),
      orderBy: plots.name,
    }),
  ])

  return (
    <NewCropPlanForm
      seasons={seasons}
      crops={allCrops}
      plots={allPlots}
      defaultSeasonId={seasonId}
    />
  )
}

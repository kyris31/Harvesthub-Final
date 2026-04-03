import { notFound } from 'next/navigation'
import { EditSeasonForm } from './edit-form'
import { getSeasonById } from '@/app/actions/planning'

export default async function EditSeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const season = await getSeasonById(id)
  if (!season) return notFound()
  return <EditSeasonForm season={season} />
}

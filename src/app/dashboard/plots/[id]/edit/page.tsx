import { notFound } from 'next/navigation'
import { EditPlotForm } from './edit-form'
import { getPlotById } from '@/app/actions/plots'

export default async function EditPlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plot = await getPlotById(id)
  if (!plot) return notFound()
  return <EditPlotForm plot={plot} />
}

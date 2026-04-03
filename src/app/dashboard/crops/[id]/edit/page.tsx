import { getCrop } from '@/app/actions/crops'
import { CropForm } from '@/components/crops/crop-form'
import { notFound } from 'next/navigation'

interface EditCropPageProps {
  params: { id: string }
}

export default async function EditCropPage({ params }: EditCropPageProps) {
  const { id } = await params
  const crop = await getCrop(id).catch(() => null)

  if (!crop) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Crop</h1>
        <p className="text-muted-foreground">Update {crop.name} details</p>
      </div>

      <CropForm
        mode="edit"
        defaultValues={{
          id: crop.id,
          name: crop.name,
          variety: crop.variety || '',
          category: crop.category as 'vegetable' | 'fruit' | 'herb' | 'grain',
          description: crop.description || '',
        }}
      />
    </div>
  )
}

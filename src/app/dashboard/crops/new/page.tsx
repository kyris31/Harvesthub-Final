import { CropForm } from '@/components/crops/crop-form'

export default function NewCropPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Crop</h1>
        <p className="text-muted-foreground">Add a new crop variety to your farm</p>
      </div>

      <CropForm mode="create" />
    </div>
  )
}

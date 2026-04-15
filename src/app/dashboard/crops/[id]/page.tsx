import { getCrop } from '@/app/actions/crops'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Edit, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

interface CropDetailPageProps {
  params: { id: string }
}

export default async function CropDetailPage({ params }: CropDetailPageProps) {
  const { id } = await params
  const crop = await getCrop(id).catch(() => null)

  if (!crop) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/crops">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Crops
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{crop.name}</h1>
          {crop.variety && <p className="text-muted-foreground text-lg">{crop.variety}</p>}
        </div>
        <Button asChild>
          <Link href={`/dashboard/crops/${crop.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Crop
          </Link>
        </Button>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Crop Details</CardTitle>
          <CardDescription>Information about this crop variety</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Name</p>
              <p className="text-base">{crop.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Variety</p>
              <p className="text-base">{crop.variety || '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Category</p>
              <Badge variant="outline">{crop.category}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Created</p>
              <p className="text-base">{new Date(crop.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
          {crop.description && (
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">Description</p>
              <p className="text-base">{crop.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Data Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Related Activity</CardTitle>
          <CardDescription>
            Plantings, harvests, and other activities for {crop.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Related data will appear here once plantings are created.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

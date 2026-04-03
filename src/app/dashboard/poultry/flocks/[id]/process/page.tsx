import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getFlocks } from '@/app/actions/flocks'
import { BroilerProcessingForm } from '@/components/poultry/broiler-processing-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProcessFlockPage({ params }: Props) {
  const { id } = await params

  // Load the flock to verify it's a broiler flock
  const allFlocks = await getFlocks()
  const flock = allFlocks.find((f) => f.id === id)

  if (!flock) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/poultry/flocks/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Flock
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Record Processing / Sale</h1>
        <p className="text-muted-foreground">
          Record the final sale of your broiler flock to calculate profit
        </p>
      </div>

      <BroilerProcessingForm
        flockId={flock.id}
        flockName={flock.name}
        currentCount={flock.currentCount}
      />
    </div>
  )
}

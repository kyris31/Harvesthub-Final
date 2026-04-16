import { getPlantingLogs } from '@/app/actions/planting'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { PlantingLogsClient } from './planting-logs-client'

export default async function PlantingPage() {
  const plantings = await getPlantingLogs()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planting Logs</h1>
          <p className="text-muted-foreground">Track your crop plantings and their progress</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/planting/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Planting
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plantings</CardTitle>
        </CardHeader>
        <CardContent>
          {plantings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No plantings yet. Add your first planting to get started!
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/planting/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Planting
                </Link>
              </Button>
            </div>
          ) : (
            <PlantingLogsClient plantings={plantings} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { getHarvestLogs } from '@/app/actions/harvests'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { HarvestsTable } from '@/components/harvests/harvests-table'

export default async function HarvestsPage() {
  const harvests = await getHarvestLogs()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Harvest Logs</h1>
          <p className="text-muted-foreground">Track your harvests and current stock</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/harvests/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Harvest
          </Link>
        </Button>
      </div>

      {/* Harvests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Harvests</CardTitle>
          <CardDescription>
            {harvests.length} {harvests.length === 1 ? 'harvest' : 'harvests'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {harvests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No harvests yet. Record your first harvest to get started!
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/harvests/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Harvest
                </Link>
              </Button>
            </div>
          ) : (
            <HarvestsTable harvests={harvests} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { getCultivationActivities } from '@/app/actions/cultivation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Droplets, Sprout, Bug, Leaf, Scissors, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function CultivationPage() {
  const activities = await getCultivationActivities()

  // Calculate stats
  const thisWeekActivities = activities.filter((a) => {
    const activityDate = new Date(a.activityDate)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return activityDate >= weekAgo
  })

  const totalCost = activities.reduce((sum, a) => sum + Number(a.cost || 0), 0)

  const activityTypeIcons: Record<string, React.ReactNode> = {
    watering: <Droplets className="h-4 w-4" />,
    fertilizing: <Sprout className="h-4 w-4" />,
    pest_control: <Bug className="h-4 w-4" />,
    weeding: <Leaf className="h-4 w-4" />,
    pruning: <Scissors className="h-4 w-4" />,
    other: <FileText className="h-4 w-4" />,
  }

  const activityTypeColors: Record<string, string> = {
    watering: 'bg-blue-500',
    fertilizing: 'bg-green-500',
    pest_control: 'bg-red-500',
    weeding: 'bg-yellow-500',
    pruning: 'bg-purple-500',
    other: 'bg-gray-500',
  }

  const activityTypeLabels: Record<string, string> = {
    watering: 'Watering',
    fertilizing: 'Fertilizing',
    pest_control: 'Pest Control',
    weeding: 'Weeding',
    pruning: 'Pruning',
    other: 'Other',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cultivation Activities</h1>
          <p className="text-muted-foreground">
            Track watering, fertilizing, pest control, and other farm activities
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cultivation/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-muted-foreground text-xs">{thisWeekActivities.length} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">All activities combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(activities.map((a) => a.activityType)).size}
            </div>
            <p className="text-muted-foreground text-xs">Different activity types</p>
          </CardContent>
        </Card>
      </div>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>All cultivation activities ordered by date</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">
              No activities recorded yet. Click "Add Activity" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`rounded-lg p-2 ${activityTypeColors[activity.activityType]}`}>
                      {activityTypeIcons[activity.activityType]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activityTypeLabels[activity.activityType]}</p>
                        <Badge variant="outline">
                          {new Date(activity.activityDate).toLocaleDateString('en-GB')}
                        </Badge>
                      </div>
                      {activity.plantingLog && (
                        <p className="text-muted-foreground text-sm">
                          {activity.plantingLog.crop.name}
                          {activity.plantingLog.plot && ` - ${activity.plantingLog.plot.name}`}
                        </p>
                      )}
                      {activity.inputInventory && (
                        <p className="text-muted-foreground text-sm">
                          Used: {activity.inputInventory.name}
                          {activity.quantityUsed &&
                            ` (${activity.quantityUsed} ${activity.quantityUnit})`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {activity.cost && (
                      <p className="font-medium">${Number(activity.cost).toFixed(2)}</p>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/cultivation/${activity.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

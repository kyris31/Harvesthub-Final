import { getFlocks } from '@/app/actions/flocks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Bird, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function FlocksPage() {
  const flocks = await getFlocks()

  const totalBirds = flocks.reduce((sum, flock) => sum + flock.currentCount, 0)
  const activeFlocks = flocks.filter((f) => f.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flocks</h1>
          <p className="text-muted-foreground">Manage your poultry flocks and track production</p>
        </div>
        <Link href="/dashboard/poultry/flocks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Flock
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flocks</CardTitle>
            <Bird className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flocks.length}</div>
            <p className="text-muted-foreground text-xs">{activeFlocks} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Birds</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBirds}</div>
            <p className="text-muted-foreground text-xs">Across all flocks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Flock Size</CardTitle>
            <AlertCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flocks.length > 0 ? Math.round(totalBirds / flocks.length) : 0}
            </div>
            <p className="text-muted-foreground text-xs">Birds per flock</p>
          </CardContent>
        </Card>
      </div>

      {/* Flocks List */}
      {flocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bird className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">No flocks yet</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Get started by adding your first flock
            </p>
            <Link href="/dashboard/poultry/flocks/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Flock
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flocks.map((flock) => (
            <Link key={flock.id} href={`/dashboard/poultry/flocks/${flock.id}`}>
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{flock.name}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        flock.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {flock.status}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{flock.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Purpose:</span>
                    <span className="font-medium capitalize">
                      {flock.purpose.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Count:</span>
                    <span className="font-bold">{flock.currentCount} birds</span>
                  </div>
                  {flock.breed && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Breed:</span>
                      <span className="font-medium">{flock.breed}</span>
                    </div>
                  )}
                  {flock.housingLocation && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{flock.housingLocation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

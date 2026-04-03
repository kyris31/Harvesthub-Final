import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Package, AlertTriangle, TrendingDown } from 'lucide-react'
import { getPoultryFeed } from '@/app/actions/poultry-feed'

export default async function FeedManagementPage() {
  const inventory = await getPoultryFeed()

  const lowStockItems = inventory.filter((item) => {
    const stockPercentage =
      (parseFloat(item.currentQuantity) / parseFloat(item.initialQuantity)) * 100
    return stockPercentage < 20
  })

  const totalValue = inventory.reduce((sum, item) => {
    return sum + parseFloat(item.currentQuantity) * parseFloat(item.costPerUnit || '0')
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feed Management</h1>
          <p className="text-muted-foreground">Track feed inventory and usage</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/poultry/feed/usage">Record Usage</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/poultry/feed/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Feed
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-muted-foreground text-xs">Feed types in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-muted-foreground text-xs">Items below 20%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => {
                const stockPercentage =
                  (parseFloat(item.currentQuantity) / parseFloat(item.initialQuantity)) * 100
                return (
                  <div
                    key={item.id}
                    className="bg-destructive/10 flex items-center justify-between rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">{item.feedType}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.brand && `${item.brand} - `}
                        {item.currentQuantity} {item.quantityUnit} remaining
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-destructive text-sm font-medium">
                        {stockPercentage.toFixed(0)}% remaining
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Feed Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No feed inventory yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your poultry feed inventory
              </p>
              <Button asChild>
                <Link href="/dashboard/poultry/feed/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Feed Item
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="p-3 text-left font-medium">Feed Type</th>
                    <th className="p-3 text-left font-medium">Brand</th>
                    <th className="p-3 text-right font-medium">Current Stock</th>
                    <th className="p-3 text-right font-medium">Initial Stock</th>
                    <th className="p-3 text-right font-medium">Cost/Unit</th>
                    <th className="p-3 text-right font-medium">Total Value</th>
                    <th className="p-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const stockPercentage =
                      (parseFloat(item.currentQuantity) / parseFloat(item.initialQuantity)) * 100
                    const totalValue =
                      parseFloat(item.currentQuantity) * parseFloat(item.costPerUnit || '0')

                    return (
                      <tr key={item.id} className="hover:bg-muted/50 border-b">
                        <td className="p-3 font-medium capitalize">{item.feedType}</td>
                        <td className="text-muted-foreground p-3">{item.brand || '-'}</td>
                        <td className="p-3 text-right">
                          {item.currentQuantity} {item.quantityUnit}
                        </td>
                        <td className="text-muted-foreground p-3 text-right">
                          {item.initialQuantity} {item.quantityUnit}
                        </td>
                        <td className="p-3 text-right">
                          ${parseFloat(item.costPerUnit || '0').toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-medium">${totalValue.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          {stockPercentage < 20 ? (
                            <span className="bg-destructive/10 text-destructive inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                              Low Stock
                            </span>
                          ) : stockPercentage < 50 ? (
                            <span className="bg-warning/10 text-warning inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                              Medium
                            </span>
                          ) : (
                            <span className="bg-success/10 text-success inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                              Good
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

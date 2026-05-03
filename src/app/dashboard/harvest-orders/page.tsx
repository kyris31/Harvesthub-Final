import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getHarvestOrders } from '@/app/actions/harvest-orders'
import { Plus, ShoppingBasket } from 'lucide-react'
import { HarvestOrdersClient } from './harvest-orders-client'

export default async function HarvestOrdersPage() {
  const orders = await getHarvestOrders()

  return (
    <div className="page-animate space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Harvest Orders</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Record customer orders received by SMS and view harvest totals
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/harvest-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order Batch
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Order Batches</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBasket className="text-muted-foreground mb-4 h-14 w-14" />
              <h3 className="mb-2 text-lg font-semibold">No harvest orders yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md text-sm">
                Create an order batch for each SMS round you send to customers, then add what each
                customer wants to purchase.
              </p>
              <Button asChild>
                <Link href="/dashboard/harvest-orders/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Order Batch
                </Link>
              </Button>
            </div>
          ) : (
            <HarvestOrdersClient orders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getHarvestOrders } from '@/app/actions/harvest-orders'
import { Plus, ShoppingBasket, Calendar, Package, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

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

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const customerCount = new Set(order.items.map((i) => i.customerName)).size
            const itemCount = order.items.length
            const grandTotal = order.items.reduce((s, i) => s + parseFloat(i.totalPrice ?? '0'), 0)
            const productCount = new Set(order.items.map((i) => i.productName)).size

            return (
              <Link key={order.id} href={`/dashboard/harvest-orders/${order.id}`}>
                <Card className="hover:border-primary/40 group cursor-pointer transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="group-hover:text-primary text-base transition-colors">
                          {order.name}
                        </CardTitle>
                        <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.orderDate), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          order.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted rounded-lg p-2">
                        <p className="text-lg font-bold">{customerCount}</p>
                        <p className="text-muted-foreground text-[10px]">Customers</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <p className="text-lg font-bold">{productCount}</p>
                        <p className="text-muted-foreground text-[10px]">Products</p>
                      </div>
                      <div className="bg-muted rounded-lg p-2">
                        <p className="text-lg font-bold">€{grandTotal.toFixed(0)}</p>
                        <p className="text-muted-foreground text-[10px]">Total</p>
                      </div>
                    </div>
                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                      <span>{itemCount} order lines</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

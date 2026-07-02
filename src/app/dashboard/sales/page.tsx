import { getSales } from '@/app/actions/sales'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { SalesList } from '@/components/business/sales-list'

export default async function SalesPage() {
  const salesData = await getSales()

  const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0)
  const totalPaid = salesData.reduce((sum, sale) => sum + parseFloat(sale.amountPaid ?? '0'), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">Track your farm product sales</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Sale
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>{salesData.length} sales</CardDescription>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">No sales yet. Record your first sale!</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/sales/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Your First Sale
                </Link>
              </Button>
            </div>
          ) : (
            <SalesList salesData={salesData} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

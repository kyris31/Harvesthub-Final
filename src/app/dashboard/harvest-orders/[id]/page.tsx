import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getHarvestOrderSummary,
  getCustomersForOrders,
  getActiveProducts,
} from '@/app/actions/harvest-orders'
import { ArrowLeft, Wheat, Users, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { OrderGrid } from './add-item-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function HarvestOrderDetailPage({ params }: Props) {
  const { id } = await params

  let summary
  try {
    summary = await getHarvestOrderSummary(id)
  } catch {
    return notFound()
  }

  const [customersList, { plantingOptions, treeOptions, eggOptions }] = await Promise.all([
    getCustomersForOrders(),
    getActiveProducts(),
  ])

  const { order, productTotals, customerBreakdown, grandTotal } = summary
  const allCustomers = [...new Set(summary.items.map((i) => i.customerName))].sort()

  return (
    <div className="page-animate space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/harvest-orders">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.name}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {format(new Date(order.orderDate), 'EEEE, dd MMMM yyyy')} ·&nbsp;
            <span
              className={`font-medium ${order.status === 'open' ? 'text-green-600' : 'text-muted-foreground'}`}
            >
              {order.status}
            </span>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/dashboard/harvest-orders/${order.id}/print`} target="_blank">
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </a>
        </Button>
      </div>

      {/* ── SPREADSHEET GRID (full width) ── */}
      <OrderGrid
        orderId={order.id}
        customers={customersList}
        plantingOptions={plantingOptions}
        treeOptions={treeOptions}
        eggOptions={eggOptions}
        existingItems={summary.items.map((i) => ({
          id: i.id,
          customerName: i.customerName,
          productName: i.productName,
          quantityKg: i.quantityKg,
          unit: i.unit,
          pricePerUnit: i.pricePerUnit ?? null,
          totalPrice: i.totalPrice ?? null,
        }))}
      />

      {/* ── TABLE 1: Products × Customers overview ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wheat className="text-primary h-4 w-4" />
            All Orders Overview
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Vegetables · Total needed · Quantity per customer
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {productTotals.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Fill in the grid above and click Save All to see results
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b">
                  <th className="p-3 text-left font-semibold">Vegetables</th>
                  <th className="text-primary p-3 text-center font-semibold">Totals</th>
                  {allCustomers.map((c) => (
                    <th key={c} className="p-3 text-center font-semibold whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productTotals
                  .sort((a, b) => a.productName.localeCompare(b.productName))
                  .map((pt, i) => (
                    <tr
                      key={pt.productName}
                      className={`border-b ${i % 2 === 1 ? 'bg-muted/20' : ''} hover:bg-muted/30`}
                    >
                      <td className="p-3 font-medium">{pt.productName}</td>
                      <td className="text-primary p-3 text-center font-semibold whitespace-nowrap">
                        {pt.quantity % 1 === 0 ? pt.quantity : pt.quantity.toFixed(1)} {pt.unit}
                      </td>
                      {allCustomers.map((customerName) => {
                        const item = summary.items.find(
                          (i) => i.customerName === customerName && i.productName === pt.productName
                        )
                        return (
                          <td key={customerName} className="p-3 text-center">
                            {item ? (
                              <span className="font-medium">
                                {parseFloat(item.quantityKg) % 1 === 0
                                  ? parseFloat(item.quantityKg)
                                  : parseFloat(item.quantityKg).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-primary/5 border-primary/20 border-t-2 font-bold">
                  <td className="p-3">Grand Total</td>
                  <td className="text-primary p-3 text-center">€{grandTotal.toFixed(2)}</td>
                  {allCustomers.map((customerName) => {
                    const cb = customerBreakdown.find((c) => c.customerName === customerName)
                    return (
                      <td key={customerName} className="text-primary p-3 text-center">
                        {cb ? `€${cb.orderTotal.toFixed(2)}` : '—'}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── TABLE 2: Per-customer cards ── */}
      {customerBreakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="text-primary h-4 w-4" />
            <h2 className="text-lg font-semibold">Per-Customer Breakdown</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customerBreakdown
              .sort((a, b) => a.customerName.localeCompare(b.customerName))
              .map((cb) => (
                <Card key={cb.customerName} className="overflow-hidden">
                  <CardHeader className="bg-muted/40 border-b px-4 py-3">
                    <CardTitle className="text-sm font-bold">{cb.customerName}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/20 border-b">
                          <th className="text-muted-foreground px-3 py-2 text-left text-xs font-medium">
                            Vegetable
                          </th>
                          <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">
                            Qty
                          </th>
                          <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">
                            €/unit
                          </th>
                          <th className="text-muted-foreground px-3 py-2 text-right text-xs font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cb.items
                          .sort((a, b) => a.productName.localeCompare(b.productName))
                          .map((item) => {
                            const qty = parseFloat(item.quantityKg)
                            const pricePerUnit = parseFloat(item.pricePerUnit ?? '0')
                            const total = parseFloat(item.totalPrice ?? '0')
                            return (
                              <tr key={item.id} className="hover:bg-muted/20 border-b">
                                <td className="px-3 py-2 font-medium">{item.productName}</td>
                                <td className="px-3 py-2 text-right">
                                  {qty % 1 === 0 ? qty : qty.toFixed(1)} {item.unit}
                                </td>
                                <td className="text-muted-foreground px-3 py-2 text-right">
                                  {pricePerUnit > 0 ? `€${pricePerUnit.toFixed(2)}` : '—'}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold">
                                  {total > 0 ? `€${total.toFixed(2)}` : '—'}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/5">
                          <td colSpan={3} className="px-3 py-2 text-right font-bold">
                            Total Price
                          </td>
                          <td className="text-primary px-3 py-2 text-right font-bold">
                            €{cb.orderTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

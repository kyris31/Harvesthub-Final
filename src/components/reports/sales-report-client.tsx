'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, ShoppingCart, DollarSign, Wallet, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ReportFilters } from '@/components/reports/report-filters'
import { exportToCSV, exportSalesReportPDF } from '@/lib/pdf-export'
import { getSalesReport } from '@/app/actions/reports'

type SalesData = Awaited<ReturnType<typeof getSalesReport>>

interface SalesReportClientProps {
  initialData: SalesData
  initialStartDate: string
  initialEndDate: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  partial: 'secondary',
  pending: 'outline',
  overdue: 'destructive',
}

export default function SalesReportClient({
  initialData,
  initialStartDate,
  initialEndDate,
}: SalesReportClientProps) {
  const [data, setData] = useState(initialData)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const handleFilterChange = async (newStart: string, newEnd: string) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    const updated = await getSalesReport(newStart, newEnd)
    setData(updated)
  }

  const handleExportCSV = () => {
    const csvData = data.sales.map((s) => ({
      date: s.saleDate,
      customer: s.customerName,
      items: s.itemCount,
      total: s.totalAmount.toFixed(2),
      paid: s.amountPaid.toFixed(2),
      outstanding: (s.totalAmount - s.amountPaid).toFixed(2),
      status: s.paymentStatus,
      method: s.paymentMethod ?? '',
    }))
    exportToCSV(csvData, 'sales-report')
  }

  const handleExportPDF = async () => {
    try {
      await exportSalesReportPDF(data, startDate, endDate)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }

  const { summary } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="print:hidden">
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">
            Sales volume, revenue, outstanding payments, and top products & customers
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <ReportFilters
          onExport={handleExportCSV}
          onExportPDF={handleExportPDF}
          onFilterChange={handleFilterChange}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.saleCount}</div>
            <p className="text-muted-foreground text-xs">
              €{summary.averageSale.toFixed(2)} average sale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{summary.totalRevenue.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">Billed across all sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{summary.totalPaid.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">Amount paid to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle
              className={`h-4 w-4 ${summary.totalOutstanding > 0 ? 'text-red-600' : 'text-muted-foreground'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.totalOutstanding > 0 ? 'text-red-600' : ''}`}
            >
              €{summary.totalOutstanding.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">Still owed by customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Sales grouped by payment status</CardDescription>
        </CardHeader>
        <CardContent>
          {data.statusBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sales in this period.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {data.statusBreakdown.map((s) => (
                <div key={s.status} className="rounded-lg border px-4 py-3">
                  <Badge variant={statusVariant[s.status] ?? 'outline'} className="capitalize">
                    {s.status}
                  </Badge>
                  <div className="mt-2 text-lg font-semibold">€{s.amount.toFixed(2)}</div>
                  <div className="text-muted-foreground text-xs">{s.count} sales</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top products & customers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Ranked by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No products sold in this period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProducts.slice(0, 10).map((p) => (
                    <TableRow key={`${p.name}-${p.unit}`}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right">
                        {p.quantity.toFixed(2)} {p.unit}
                      </TableCell>
                      <TableCell className="text-right">€{p.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Ranked by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm">No customers in this period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCustomers.slice(0, 10).map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.orders}</TableCell>
                      <TableCell className="text-right">€{c.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All sales */}
      <Card>
        <CardHeader>
          <CardTitle>Sales</CardTitle>
          <CardDescription>{data.sales.length} sales in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {data.sales.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sales in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sales.map((s) => {
                  const outstanding = s.totalAmount - s.amountPaid
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{s.saleDate}</TableCell>
                      <TableCell className="font-medium">{s.customerName}</TableCell>
                      <TableCell className="text-right">{s.itemCount}</TableCell>
                      <TableCell className="text-right">€{s.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">€{s.amountPaid.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${outstanding > 0 ? 'text-red-600' : ''}`}>
                        €{outstanding.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[s.paymentStatus] ?? 'outline'}
                          className="capitalize"
                        >
                          {s.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

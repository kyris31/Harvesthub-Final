'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { ReportFilters } from '@/components/reports/report-filters'
import { exportToCSV, exportFinancialReportPDF } from '@/lib/pdf-export'

interface FinancialData {
  revenue: { total: number; count: number }
  expenses: { total: number; count: number }
  profit: { total: number; margin: number }
}

interface FinancialReportClientProps {
  initialData: FinancialData
}

export default function FinancialReportClient({ initialData }: FinancialReportClientProps) {
  const [data, setData] = useState(initialData)

  const handleExportCSV = () => {
    const csvData = [
      { metric: 'Total Revenue', value: data.revenue.total, count: data.revenue.count },
      { metric: 'Total Expenses', value: data.expenses.total, count: data.expenses.count },
      { metric: 'Net Profit', value: data.profit.total, margin: `${data.profit.margin}%` },
    ]
    exportToCSV(csvData, 'financial-report')
  }

  const handleExportPDF = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await exportFinancialReportPDF(data, startDate, endDate)
    } catch (err: any) {
      console.error('PDF export failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="print:hidden">
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Report</h1>
          <p className="text-muted-foreground">Revenue, expenses, and profitability analysis</p>
        </div>
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <ReportFilters onExport={handleExportCSV} onExportPDF={handleExportPDF} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{data.revenue.total.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">{data.revenue.count} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{data.expenses.total.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">{data.expenses.count} expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {data.profit.total >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${data.profit.total >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              €{data.profit.total.toFixed(2)}
            </div>
            <p className="text-muted-foreground text-xs">
              {data.profit.margin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
          <CardDescription>Key financial metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Total Revenue</span>
              <span className="text-sm font-semibold text-green-600">
                €{data.revenue.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Total Expenses</span>
              <span className="text-sm font-semibold text-red-600">
                €{data.expenses.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Net Profit</span>
              <span
                className={`text-sm font-semibold ${data.profit.total >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                €{data.profit.total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profit Margin</span>
              <Badge variant={data.profit.margin >= 0 ? 'default' : 'destructive'}>
                {data.profit.margin.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

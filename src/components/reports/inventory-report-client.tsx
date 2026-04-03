'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ReportFilters } from '@/components/reports/report-filters'
import { exportToCSV, exportInventoryReportPDF } from '@/lib/pdf-export'

interface InventoryReportProps {
  initialData: {
    totalValue: number
    lowStockCount: number
    seeds: {
      items: Array<any>
      lowStock: Array<any>
      totalValue: number
    }
    inputs: {
      items: Array<any>
      lowStock: Array<any>
      totalValue: number
    }
    seedlings: {
      items: Array<any>
      lowStock: Array<any>
      totalValue: number
    }
  }
}

export default function InventoryReportClient({ initialData }: InventoryReportProps) {
  const [data] = useState(initialData)

  const handleExportCSV = () => {
    const csvData = [
      ...data.seeds.items.map((s: any) => ({
        category: 'Seeds',
        item: s.batchCode,
        quantity: `${s.currentQuantity} ${s.quantityUnit}`,
        value: `€${(s.currentQuantity * Number(s.costPerUnit || 0)).toFixed(2)}`,
      })),
      ...data.inputs.items.map((i: any) => ({
        category: 'Inputs',
        item: i.name,
        quantity: `${i.currentQuantity || 0} ${i.quantityUnit || ''}`,
        value: `€${(Number(i.currentQuantity || 0) * Number(i.costPerUnit || 0)).toFixed(2)}`,
      })),
    ]
    exportToCSV(csvData, 'inventory-report')
  }

  const handleExportPDF = () => {
    exportInventoryReportPDF(data)
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
          <h1 className="text-3xl font-bold tracking-tight">Inventory Report</h1>
          <p className="text-muted-foreground">Stock levels and inventory value tracking</p>
        </div>
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <ReportFilters
          onExport={handleExportCSV}
          onExportPDF={handleExportPDF}
          showCategoryFilter
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${data.totalValue.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">All inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seeds</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.seeds.items.length}</div>
            <p className="text-muted-foreground text-xs">
              ${data.seeds.totalValue.toFixed(2)} value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inputs</CardTitle>
            <Package className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inputs.items.length}</div>
            <p className="text-muted-foreground text-xs">
              ${data.inputs.totalValue.toFixed(2)} value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.lowStockCount}</div>
            <p className="text-muted-foreground text-xs">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockCount > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Low Stock Alert</CardTitle>
            </div>
            <CardDescription className="text-orange-700">
              Items running low that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...data.inputs.lowStock, ...data.seedlings.lowStock].map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.batchCode || item.name || 'Seedling'}
                    </p>
                    <p className="text-muted-foreground text-xs">{item.type || 'Seed Batch'}</p>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
          <CardDescription>Total inventory value by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Seeds Value</span>
              <span className="text-sm font-semibold text-green-600">
                ${data.seeds.totalValue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Inputs Value</span>
              <span className="text-sm font-semibold text-green-600">
                ${data.inputs.totalValue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium">Seedlings Value</span>
              <span className="text-sm font-semibold text-green-600">
                ${data.seedlings.totalValue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Value</span>
              <Badge>${data.totalValue.toFixed(2)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getCropPerformanceReport } from '@/app/actions/reports'
import { exportToCSV, exportCropPerformancePDF } from '@/lib/pdf-export'

type CropRow = {
  cropId: string
  cropName: string
  totalPlanted: number
  totalPlantedDisplay: string
  plantsProduced: number
  totalProduced: number
  totalProducedDisplay: string
  totalSales: number
  totalSalesDisplay: string
  difference: number
  differenceDisplay: string
}

export default function CropPerformanceClient({
  initialData,
  initialStartDate,
  initialEndDate,
}: {
  initialData: CropRow[]
  initialStartDate: string
  initialEndDate: string
}) {
  const [data, setData] = useState(initialData)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await getCropPerformanceReport(startDate, endDate)
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    exportToCSV(
      data.map((r) => ({
        'Crop Name': r.cropName,
        'Total Planted': r.totalPlantedDisplay,
        'Plants Prod.': r.plantsProduced,
        'Total Prod.': r.totalProducedDisplay,
        'Total Sales': r.totalSalesDisplay,
        'Difference (Prod - Sales)': r.differenceDisplay,
      })),
      'crop-performance-report'
    )
  }

  const handleExportPDF = async () => {
    await exportCropPerformancePDF(data, startDate, endDate)
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
          <h1 className="text-3xl font-bold tracking-tight">Crop Performance Report</h1>
          <p className="text-muted-foreground">Planted, produced, harvested and sales per crop</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleExportCSV}
              disabled={data.length === 0}
            >
              Export CSV
            </Button>
            <Button variant="destructive" onClick={handleExportPDF} disabled={data.length === 0}>
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Crop Name
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Total Planted
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Plants Prod.
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Total Prod.
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Total Sales
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Difference (Prod - Sales)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-10 text-center">
                    No data found. Adjust the date range and click Generate Report.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.cropId} className="hover:bg-muted/30 border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.cropName}</td>
                    <td className="px-4 py-3 text-right">{row.totalPlantedDisplay}</td>
                    <td className="px-4 py-3 text-right">{row.plantsProduced}</td>
                    <td className="px-4 py-3 text-right">{row.totalProducedDisplay}</td>
                    <td className="px-4 py-3 text-right">{row.totalSalesDisplay}</td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.difference < 0 ? 'text-destructive' : 'text-green-600'
                      }`}
                    >
                      {row.differenceDisplay}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSeedlingLifecycleReport } from '@/app/actions/reports'
import { exportToCSV, exportSeedlingLifecyclePDF } from '@/lib/pdf-export'

type LifecycleRow = {
  id: string
  cropName: string
  sourceLabel: string
  sowingDate: string | null
  sownQty: string
  produced: number
  transplanted: number
  harvested: number
  sold: number
  remaining: number
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB')
}

export default function SeedlingLifecycleClient({
  initialData,
  initialStartDate,
  initialEndDate,
}: {
  initialData: LifecycleRow[]
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
      const result = await getSeedlingLifecycleReport(startDate, endDate)
      setData(result)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    exportToCSV(
      data.map((r) => ({
        Crop: r.cropName,
        Source: r.sourceLabel,
        'Sown / Purchased': fmt(r.sowingDate),
        'Sown Qty': r.sownQty,
        Produced: r.produced,
        Transplanted: r.transplanted,
        Harvested: r.harvested,
        Sold: r.sold,
        'Remaining Seedlings': r.remaining,
      })),
      'seedling-lifecycle-report'
    )
  }

  const handleExportPDF = async () => {
    await exportSeedlingLifecyclePDF(data, startDate, endDate)
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
          <h1 className="text-3xl font-bold tracking-tight">Seedling Lifecycle Report</h1>
          <p className="text-muted-foreground">
            Track seedlings from sowing through transplanting, harvest and sales
          </p>
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
                  Crop
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Sown / Purchased
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Sown Qty
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Produced
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Transplanted
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Harvested
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Sold
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                  Remaining Seedlings
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-muted-foreground px-4 py-10 text-center">
                    No seedling records found. Adjust the date range and click Generate Report.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.cropName}</td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">{row.sourceLabel}</td>
                    <td className="text-muted-foreground px-4 py-3">{fmt(row.sowingDate)}</td>
                    <td className="text-muted-foreground px-4 py-3">{row.sownQty}</td>
                    <td className="px-4 py-3 text-right">{row.produced}</td>
                    <td className="px-4 py-3 text-right">{Number(row.transplanted).toFixed(0)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={Number(row.harvested) > 0 ? 'font-medium text-green-600' : ''}
                      >
                        {Number(row.harvested).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={Number(row.sold) > 0 ? 'font-medium text-blue-600' : ''}>
                        {Number(row.sold).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          row.remaining > 0 ? 'font-medium text-amber-600' : 'text-muted-foreground'
                        }
                      >
                        {row.remaining}
                      </span>
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

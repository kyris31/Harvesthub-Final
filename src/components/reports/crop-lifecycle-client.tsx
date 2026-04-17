'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getCropLifecycleReport } from '@/app/actions/reports'
import { exportToCSV, exportCropLifecyclePDF } from '@/lib/pdf-export'

type LifecycleRow = {
  id: string
  cropName: string
  sourceLabel: string
  sowingDate: string | null
  sownQty: string
  produced: number | null
  transplanted: number | null
  harvested: number
  sold: number
  remaining: number | null
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB')
}

const sourceBadgeClass = (source: string) => {
  switch (source) {
    case 'Self-Produced':
      return 'bg-green-100 text-green-800'
    case 'Purchased':
      return 'bg-blue-100 text-blue-800'
    case 'Direct Sow':
      return 'bg-amber-100 text-amber-800'
    default:
      return ''
  }
}

export default function CropLifecycleClient({
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
      const result = await getCropLifecycleReport(startDate, endDate)
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
        Date: fmt(r.sowingDate),
        'Qty In': r.sownQty,
        Produced: r.produced ?? '—',
        Transplanted: r.transplanted ?? '—',
        Harvested: r.harvested,
        Sold: r.sold,
        'Remaining Seedlings': r.remaining ?? '—',
      })),
      'crop-lifecycle-report'
    )
  }

  const handleExportPDF = async () => {
    await exportCropLifecyclePDF(data, startDate, endDate)
  }

  const selfCount = data.filter((r) => r.sourceLabel === 'Self-Produced').length
  const purchCount = data.filter((r) => r.sourceLabel === 'Purchased').length
  const directCount = data.filter((r) => r.sourceLabel === 'Direct Sow').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="print:hidden">
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crop Lifecycle Report</h1>
          <p className="text-muted-foreground">
            Complete planting picture — direct sow, self-produced seedlings and purchased plants
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
          {data.length > 0 && (
            <div className="text-muted-foreground flex flex-wrap gap-2 pt-1 text-sm">
              <span>{data.length} entries:</span>
              {selfCount > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {selfCount} Self-Produced
                </Badge>
              )}
              {purchCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {purchCount} Purchased
                </Badge>
              )}
              {directCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {directCount} Direct Sow
                </Badge>
              )}
            </div>
          )}
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
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                  Qty In
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
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-muted-foreground px-4 py-10 text-center">
                    No records found. Adjust the date range and click Generate Report.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30 border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{row.cropName}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={sourceBadgeClass(row.sourceLabel)}>
                        {row.sourceLabel}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{fmt(row.sowingDate)}</td>
                    <td className="text-muted-foreground px-4 py-3">{row.sownQty}</td>
                    <td className="px-4 py-3 text-right">
                      {row.produced !== null ? (
                        row.produced
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.transplanted !== null ? (
                        Number(row.transplanted).toFixed(0)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
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
                      {row.remaining !== null ? (
                        <span
                          className={
                            row.remaining > 0
                              ? 'font-medium text-amber-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {row.remaining}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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

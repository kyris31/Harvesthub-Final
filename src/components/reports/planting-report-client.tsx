'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sprout } from 'lucide-react'
import Link from 'next/link'
import { ReportFilters } from '@/components/reports/report-filters'
import { exportToCSV, exportPlantingReportPDF } from '@/lib/pdf-export'
import { getPlantingReport } from '@/app/actions/reports'

type PlantingLog = {
  id: string
  plantingDate: string | null
  quantityPlanted: string | null
  quantityUnit: string | null
  expectedHarvestDate: string | null
  status: string | null
  crop: { name: string; variety: string | null } | null
  plot: { name: string } | null
}

type PlantingReportData = {
  logs: PlantingLog[]
  total: number
  active: number
  harvested: number
  failed: number
}

interface PlantingReportClientProps {
  initialData: PlantingReportData
  initialStartDate: string
  initialEndDate: string
}

const statusVariant = (status: string | null) => {
  switch (status) {
    case 'active':
      return 'default'
    case 'harvested':
      return 'secondary'
    case 'failed':
      return 'destructive'
    case 'completed':
      return 'outline'
    default:
      return 'outline'
  }
}

export default function PlantingReportClient({
  initialData,
  initialStartDate,
  initialEndDate,
}: PlantingReportClientProps) {
  const [data, setData] = useState(initialData)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const handleFilterChange = async (newStart: string, newEnd: string) => {
    setStartDate(newStart)
    setEndDate(newEnd)
    const updated = await getPlantingReport(newStart, newEnd)
    setData(updated)
  }

  const handleExportCSV = () => {
    const csvData = data.logs.map((l) => ({
      crop: `${l.crop?.name ?? '—'}${l.crop?.variety ? ` - ${l.crop.variety}` : ''}`,
      plot: l.plot?.name ?? '—',
      plantingDate: l.plantingDate ? new Date(l.plantingDate).toLocaleDateString() : '—',
      quantity: `${l.quantityPlanted ?? '—'} ${l.quantityUnit ?? ''}`.trim(),
      expectedHarvest: l.expectedHarvestDate
        ? new Date(l.expectedHarvestDate).toLocaleDateString()
        : '—',
      status: l.status ?? '—',
    }))
    exportToCSV(csvData, 'planting-report')
  }

  const handleExportPDF = async () => {
    try {
      await exportPlantingReportPDF(data, startDate, endDate)
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
          <h1 className="text-3xl font-bold tracking-tight">Planting Log Report</h1>
          <p className="text-muted-foreground">Overview of crop plantings and their status</p>
        </div>
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <ReportFilters
          onExport={handleExportCSV}
          onExportPDF={handleExportPDF}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plantings</CardTitle>
            <Sprout className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-muted-foreground text-xs">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Sprout className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.active}</div>
            <p className="text-muted-foreground text-xs">Currently growing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harvested</CardTitle>
            <Sprout className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.harvested}</div>
            <p className="text-muted-foreground text-xs">Completed harvest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <Sprout className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.failed}</div>
            <p className="text-muted-foreground text-xs">Failed plantings</p>
          </CardContent>
        </Card>
      </div>

      {/* Planting Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Planting Logs</CardTitle>
          <CardDescription>
            {data.total} planting{data.total !== 1 ? 's' : ''} from {startDate} to {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.logs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No planting records found for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pr-4 pb-3 font-medium">Crop</th>
                    <th className="pr-4 pb-3 font-medium">Plot</th>
                    <th className="pr-4 pb-3 font-medium">Planting Date</th>
                    <th className="pr-4 pb-3 font-medium">Quantity</th>
                    <th className="pr-4 pb-3 font-medium">Expected Harvest</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <span className="font-medium">{log.crop?.name ?? '—'}</span>
                        {log.crop?.variety && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            ({log.crop.variety})
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground py-3 pr-4">{log.plot?.name ?? '—'}</td>
                      <td className="py-3 pr-4">
                        {log.plantingDate ? new Date(log.plantingDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {log.quantityPlanted
                          ? `${log.quantityPlanted} ${log.quantityUnit ?? ''}`
                          : '—'}
                      </td>
                      <td className="text-muted-foreground py-3 pr-4">
                        {log.expectedHarvestDate
                          ? new Date(log.expectedHarvestDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3">
                        <Badge variant={statusVariant(log.status)}>{log.status ?? '—'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

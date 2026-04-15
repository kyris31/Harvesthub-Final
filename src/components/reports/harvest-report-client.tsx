'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ReportFilters } from '@/components/reports/report-filters'
import { exportToCSV, exportHarvestReportPDF } from '@/lib/pdf-export'

interface HarvestReportProps {
  initialData: {
    harvests: Array<{
      id: string
      harvestDate: string
      quantityHarvested: string
      quantityUnit: string
      currentStock: string
      notes: string | null
      qualityGrade: string | null
    }>
    totalYield: number
    harvestCount: number
  }
}

export default function HarvestReportClient({ initialData }: HarvestReportProps) {
  const [data] = useState(initialData)

  const handleExportCSV = () => {
    const csvData = data.harvests.map((h) => ({
      date: new Date(h.harvestDate).toLocaleDateString(),
      harvested: `${Number(h.quantityHarvested).toFixed(2)} ${h.quantityUnit}`,
      currentStock: `${Number(h.currentStock).toFixed(2)} ${h.quantityUnit}`,
      grade: h.qualityGrade || 'N/A',
      notes: h.notes || '',
    }))
    exportToCSV(csvData, 'harvest-report')
  }

  const handleExportPDF = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await exportHarvestReportPDF(data, startDate, endDate)
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
          <h1 className="text-3xl font-bold tracking-tight">Harvest Report</h1>
          <p className="text-muted-foreground">Yield analysis and productivity metrics</p>
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
            <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.totalYield.toFixed(2)} kg</div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Harvests</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.harvestCount}</div>
            <p className="text-muted-foreground text-xs">Harvest operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average per Harvest</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.harvestCount > 0 ? (data.totalYield / data.harvestCount).toFixed(2) : 0} kg
            </div>
            <p className="text-muted-foreground text-xs">Per operation</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Harvests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Harvests</CardTitle>
          <CardDescription>Latest harvest operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.harvests.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No harvest records found for this period
              </p>
            ) : (
              data.harvests.slice(0, 10).map((harvest) => (
                <div key={harvest.id} className="flex items-center justify-between border-b pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {new Date(harvest.harvestDate).toISOString().split('T')[0]}
                      </Badge>
                      <Badge variant="outline">{harvest.quantityUnit}</Badge>
                    </div>
                    {harvest.notes && (
                      <p className="text-muted-foreground text-xs">{harvest.notes}</p>
                    )}
                    {harvest.qualityGrade && (
                      <Badge variant="secondary" className="text-xs">
                        Grade: {harvest.qualityGrade}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {Number(harvest.quantityHarvested).toFixed(2)} kg
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Stock: {Number(harvest.currentStock).toFixed(2)} kg
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

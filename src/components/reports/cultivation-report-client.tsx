'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Activity, Droplets, Sprout, Bug, Leaf, Scissors, FileText } from 'lucide-react'
import Link from 'next/link'
import { ReportFilters } from '@/components/reports/report-filters'
import { exportToCSV, exportCultivationReportPDF } from '@/lib/pdf-export'

interface CultivationReportProps {
  initialData: {
    totalActivities: number
    totalCost: number
    activityByType: Record<string, { count: number; totalCost: number }>
    activities: Array<any>
  }
}

const activityIcons: Record<string, any> = {
  watering: Droplets,
  fertilizing: Sprout,
  pest_control: Bug,
  weeding: Leaf,
  pruning: Scissors,
  other: FileText,
}

const activityColors: Record<string, string> = {
  watering: 'bg-blue-100 text-blue-800',
  fertilizing: 'bg-green-100 text-green-800',
  pest_control: 'bg-red-100 text-red-800',
  weeding: 'bg-yellow-100 text-yellow-800',
  pruning: 'bg-purple-100 text-purple-800',
  other: 'bg-gray-100 text-gray-800',
}

export default function CultivationReportClient({ initialData }: CultivationReportProps) {
  const [data] = useState(initialData)

  const handleExportCSV = () => {
    const csvData = data.activities.map((a: any) => ({
      type: a.activityType.replace('_', ' '),
      date: new Date(a.activityDate).toLocaleDateString(),
      quantity: a.quantityUsed ? `${a.quantityUsed} ${a.quantityUnit}` : 'N/A',
      cost: a.cost ? `€${Number(a.cost).toFixed(2)}` : 'N/A',
      notes: a.notes || '',
    }))
    exportToCSV(csvData, 'cultivation-report')
  }

  const handleExportPDF = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await exportCultivationReportPDF(data, startDate, endDate)
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
          <h1 className="text-3xl font-bold tracking-tight">Cultivation Report</h1>
          <p className="text-muted-foreground">Activity tracking and input usage analysis</p>
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
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.totalActivities}</div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalCost.toFixed(2)}</div>
            <p className="text-muted-foreground text-xs">Input costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Types</CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(data.activityByType).length}</div>
            <p className="text-muted-foreground text-xs">Different types</p>
          </CardContent>
        </Card>
      </div>

      {/* Activities by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Activities by Type</CardTitle>
          <CardDescription>Breakdown of cultivation activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.activityByType).map(([type, stats]: [string, any]) => {
              const Icon = activityIcons[type] || FileText
              return (
                <div key={type} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${activityColors[type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{type.replace('_', ' ')}</p>
                      <p className="text-muted-foreground text-xs">{stats.count} activities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${stats.totalCost.toFixed(2)}</p>
                    <p className="text-muted-foreground text-xs">
                      ${stats.count > 0 ? (stats.totalCost / stats.count).toFixed(2) : 0} avg
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>Latest cultivation operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.activities.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No cultivation activities found for this period
              </p>
            ) : (
              data.activities.slice(0, 10).map((activity: any) => {
                const Icon = activityIcons[activity.activityType] || FileText
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${activityColors[activity.activityType]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize">
                            {activity.activityType.replace('_', ' ')}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {new Date(activity.activityDate).toISOString().split('T')[0]}
                          </Badge>
                        </div>
                        {activity.notes && (
                          <p className="text-muted-foreground text-xs">{activity.notes}</p>
                        )}
                        {activity.quantityUsed && (
                          <p className="text-muted-foreground text-xs">
                            Used: {activity.quantityUsed} {activity.quantityUnit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.cost && (
                        <p className="text-sm font-semibold">${Number(activity.cost).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

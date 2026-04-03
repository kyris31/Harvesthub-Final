'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Filter } from 'lucide-react'

interface ReportFiltersProps {
  onExport?: () => void
  onExportPDF?: () => void
  onFilterChange?: (startDate: string, endDate: string) => void
  showCategoryFilter?: boolean
}

export function ReportFilters({
  onExport,
  onExportPDF,
  onFilterChange,
  showCategoryFilter,
}: ReportFiltersProps) {
  const router = useRouter()
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange(startDate, endDate)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
        <CardDescription>
          Apply date ranges to all reports.{' '}
          {showCategoryFilter && 'Category filter applies only to Inventory reports.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date (for all reports)</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date (for all reports)</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {showCategoryFilter && (
            <div className="space-y-2">
              <Label htmlFor="category">Inventory Category</Label>
              <select
                id="category"
                className="border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="all">All Inventory Categories</option>
                <option value="seeds">Seeds</option>
                <option value="inputs">Inputs</option>
                <option value="seedlings">Seedlings</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>

        <div className="border-t pt-4">
          <CardTitle className="mb-3 text-sm">Download Data Exports</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onExportPDF} variant="destructive" size="sm" disabled={!onExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export Report (PDF)
            </Button>
            {onExport && (
              <Button onClick={onExport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Data (CSV)
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            PDF files will be saved to your Downloads folder
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

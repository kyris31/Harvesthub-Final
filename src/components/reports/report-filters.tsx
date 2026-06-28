'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Filter } from 'lucide-react'

interface ReportFiltersProps {
  onExport?: (category?: string) => void
  onExportPDF?: (category?: string) => void
  onFilterChange?: (startDate: string, endDate: string) => void
  showCategoryFilter?: boolean
  initialStartDate?: string
  initialEndDate?: string
}

export function ReportFilters({
  onExport,
  onExportPDF,
  onFilterChange,
  showCategoryFilter,
  initialStartDate,
  initialEndDate,
}: ReportFiltersProps) {
  const [startDate, setStartDate] = useState(() => {
    if (initialStartDate) return initialStartDate
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => {
    return initialEndDate ?? new Date().toISOString().slice(0, 10)
  })
  const [category, setCategory] = useState('all')

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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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

        {(onExportPDF || onExport) && (
          <div className="border-t pt-4">
            <CardTitle className="mb-3 text-sm">Download Data Exports</CardTitle>
            <div className="flex flex-wrap gap-2">
              {onExportPDF && (
                <Button
                  onClick={() => onExportPDF(showCategoryFilter ? category : undefined)}
                  variant="destructive"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report (PDF)
                </Button>
              )}
              {onExport && (
                <Button
                  onClick={() => onExport(showCategoryFilter ? category : undefined)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data (CSV)
                </Button>
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              PDF files will be saved to your Downloads folder
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Printer, Search, X, FileText } from 'lucide-react'
import Link from 'next/link'
import { exportSaleInvoicePDF } from '@/lib/pdf-export'

type Sale = {
  id: string
  saleDate: string
  totalAmount: string
  amountPaid: string | null
  paymentStatus: string | null
  customer?: { name: string } | null
  saleItems?: Array<{ id: string; productName: string; quantity: string; unit: string }>
}

export function SalesList({ salesData }: { salesData: Sale[] }) {
  const [query, setQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return salesData.filter((sale) => {
      // Date range — saleDate is stored as an ISO 'yyyy-mm-dd' string, so string
      // comparison against the picker values is safe and timezone-free.
      const day = sale.saleDate.slice(0, 10)
      if (startDate && day < startDate) return false
      if (endDate && day > endDate) return false

      if (!q) return true
      const customer = (sale.customer?.name ?? 'Walk-in').toLowerCase()
      const products = (sale.saleItems ?? []).map((i) => i.productName.toLowerCase()).join(' ')
      return customer.includes(q) || products.includes(q)
    })
  }, [salesData, query, startDate, endDate])

  const hasFilters = query.trim() !== '' || startDate !== '' || endDate !== ''
  const clearFilters = () => {
    setQuery('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="relative w-full max-w-sm sm:w-auto sm:flex-1">
          <Label htmlFor="sales-search" className="mb-2 block">
            Search
          </Label>
          <Search className="text-muted-foreground absolute bottom-2.5 left-3 h-4 w-4" />
          <Input
            id="sales-search"
            placeholder="Product or customer (e.g. cucumber)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sales-start">From</Label>
          <Input
            id="sales-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sales-end">To</Label>
          <Input
            id="sales-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Showing {filtered.length} of {salesData.length} sales
      </p>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No sales match the current filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{new Date(sale.saleDate).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>{sale.customer?.name || 'Walk-in'}</TableCell>
                <TableCell className="max-w-xs">
                  {sale.saleItems && sale.saleItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {sale.saleItems.map((item) => (
                        <Badge key={item.id} variant="outline" className="font-normal">
                          {item.productName} · {parseFloat(item.quantity).toFixed(2)} {item.unit}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  €{parseFloat(sale.totalAmount).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={sale.paymentStatus === 'paid' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {sale.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Issue invoice (PDF)"
                      onClick={() =>
                        exportSaleInvoicePDF(sale).catch((err) =>
                          console.error('Invoice PDF export failed:', err)
                        )
                      }
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild title="Print receipt">
                      <Link href={`/dashboard/sales/${sale.id}/print`} target="_blank">
                        <Printer className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/sales/${sale.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

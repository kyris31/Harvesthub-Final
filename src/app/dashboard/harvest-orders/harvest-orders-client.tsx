'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Edit, Search } from 'lucide-react'
import { format } from 'date-fns'
import type { getHarvestOrders } from '@/app/actions/harvest-orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteHarvestOrderButton } from '@/components/harvest-orders/delete-harvest-order-button'

type HarvestOrder = Awaited<ReturnType<typeof getHarvestOrders>>[number]

const STATUS_OPTIONS = ['all', 'open', 'closed'] as const

export function HarvestOrdersClient({ orders }: { orders: HarvestOrder[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = o.name.toLowerCase().includes(search.toLowerCase().trim())
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by batch name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <p className="text-muted-foreground text-sm">
        {filtered.length} {filtered.length === 1 ? 'batch' : 'batches'} found
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No order batches match your filters.</p>
          {(search || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customers</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Order Lines</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((order) => {
              const customerCount = new Set(order.items.map((i) => i.customerName)).size
              const productCount = new Set(order.items.map((i) => i.productName)).size
              const grandTotal = order.items.reduce(
                (s, i) => s + parseFloat(i.totalPrice ?? '0'),
                0
              )

              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/harvest-orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.name}
                    </Link>
                  </TableCell>
                  <TableCell>{format(new Date(order.orderDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{customerCount}</TableCell>
                  <TableCell>{productCount}</TableCell>
                  <TableCell>{order.items.length}</TableCell>
                  <TableCell>€{grandTotal.toFixed(2)}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/harvest-orders/${order.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteHarvestOrderButton orderId={order.id} orderName={order.name} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

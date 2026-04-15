'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Plus } from 'lucide-react'
import { AddPaymentDialog } from './add-payment-dialog'

interface Payment {
  id: string
  paymentDate: string
  amount: string
  paymentMethod: string | null
  referenceNumber: string | null
  notes: string | null
  user: {
    id: string
    name: string | null
  }
}

interface PaymentTrackerProps {
  invoiceId: string
  totalAmount: string
  paidAmount: string
  paymentStatus: string | null
  payments: Payment[]
}

export function PaymentTracker({
  invoiceId,
  totalAmount,
  paidAmount,
  paymentStatus,
  payments,
}: PaymentTrackerProps) {
  const [showAddPayment, setShowAddPayment] = useState(false)

  const total = parseFloat(totalAmount)
  const paid = parseFloat(paidAmount)
  const remaining = total - paid
  const progressPercentage = total > 0 ? (paid / total) * 100 : 0

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500'
      case 'partial':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'partial':
        return 'Partially Paid'
      default:
        return 'Unpaid'
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Tracking</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(paymentStatus)}>{getStatusLabel(paymentStatus)}</Badge>
            <Button size="sm" onClick={() => setShowAddPayment(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-muted-foreground text-sm">Total Amount</p>
                <p className="text-lg font-semibold">€{total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Paid</p>
                <p className="text-lg font-semibold text-green-600">€{paid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Remaining</p>
                <p className="text-lg font-semibold text-orange-600">€{remaining.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Payment History</h4>
              <div className="rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b text-sm">
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Method</th>
                      <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-left">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-muted/30 border-b last:border-0">
                        <td className="p-3 text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3 text-sm font-medium">
                          €{parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="p-3 text-sm capitalize">
                          {payment.paymentMethod?.replace('_', ' ') || '-'}
                        </td>
                        <td className="text-muted-foreground p-3 text-sm">
                          {payment.referenceNumber || '-'}
                        </td>
                        <td className="text-muted-foreground p-3 text-sm">
                          {payment.user.name || 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <p>No payments recorded yet</p>
              <p className="text-sm">Click "Add Payment" to record a payment</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentDialog
        invoiceId={invoiceId}
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
      />
    </>
  )
}
